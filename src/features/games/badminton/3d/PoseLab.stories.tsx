import { useFrame } from "@react-three/fiber";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useMemo, useState } from "react";
import { DirectionalLight, Vector3, type AnimationClip, type Group, type Texture } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { applyClips, makeAthlete } from "../../three/athlete";
import { loadAthleteFiles, prepareAthlete } from "../../three/assets";
import { GameCanvas } from "../../three/GameCanvas";
import { SETTINGS } from "../../three/settings";
import { tokenColor } from "../../three/tokens";
import type { CameraPose } from "../../three/track";
import { BASE_Z, CAMERA, COURT, GRAVITY, RECEIVE_Z } from "./court";
import { buildBadmintonClips } from "./moves";
import { makeBadmintonProps } from "./props";
import { measureReach, type Reach } from "./reach";
import { TAU } from "./shuttle";
import {
  BLOCK_CLIP,
  DIVE_CLIP,
  FIST_PUMP_CLIP,
  JUMP_SMASH_CLIP,
  LIFT_CLIP,
  NET_CLIP,
  OVERHEAD_CLIP,
  SERVE_CLIP,
  STRETCH_CLIP,
  type BadmintonClip,
} from "./timing";

interface LabAssets {
  body: GLTF;
  clips: AnimationClip[];
  skin: Texture;
  reach: Reach;
}

/**
 * The broadcast camera's line to a player, from his chest (m): behind you at your receiving depth, and in front of
 * Yash at his base. The lab looks along the same line from closer (`TV_NEAR` of the way), so he fills the frame.
 */
const [, camY, camZ] = CAMERA.tv.stage.position;
const TV_LINE = { you: [camY - 1, -(camZ - RECEIVE_Z)], yash: [camY - 1, camZ + BASE_Z] } as const;
const TV_NEAR = 0.45;
/**
 * Views for judging a pose of the athlete at the origin facing +z. `tv`: along the broadcast camera's line to you
 * (behind you); `tvYash`: along its line to Yash, across the net.
 */
const VIEWS: Record<"tv" | "tvYash" | "side" | "front" | "back", CameraPose> = {
  tv: {
    position: [0, 1 + TV_LINE.you[0] * TV_NEAR, TV_LINE.you[1] * TV_NEAR],
    target: [0, 1, 0.4],
  },
  tvYash: {
    position: [0, 1 + TV_LINE.yash[0] * TV_NEAR, TV_LINE.yash[1] * TV_NEAR],
    target: [0, 1, 0.4],
  },
  side: { position: [-6.5, 1.3, 0.6], target: [0, 1.1, 0.6] },
  front: { position: [0, 1.5, 6.5], target: [0, 1.1, 0] },
  back: { position: [0, 1.7, -6.5], target: [0, 1.1, 0] },
};
/** Each stroke's contact beat and the reach it is measured at, so the lab shows a shuttle there. */
const STROKES: Partial<Record<BadmintonClip, { at: number; reach: keyof Reach }>> = {
  serve: { at: SERVE_CLIP.contact, reach: "serve" },
  overhead: { at: OVERHEAD_CLIP.contact, reach: "overhead" },
  jumpSmash: { at: JUMP_SMASH_CLIP.contact, reach: "jumpSmash" },
  net: { at: NET_CLIP.contact, reach: "net" },
  lift: { at: LIFT_CLIP.contact, reach: "lift" },
  block: { at: BLOCK_CLIP.contact, reach: "block" },
  dive: { at: DIVE_CLIP.contact, reach: "dive" },
};
const CLIPS: BadmintonClip[] = [
  "ready",
  "split",
  "shuffleL",
  "shuffleR",
  "serve",
  "overhead",
  "jumpSmash",
  "net",
  "lift",
  "block",
  "dive",
  "stretchF",
  "stretchB",
  "fistPump",
  "idle",
  "walk",
  "jog",
  "sprint",
];
const LONGEST = Math.max(DIVE_CLIP.end, JUMP_SMASH_CLIP.end, FIST_PUMP_CLIP.end, STRETCH_CLIP.end);

interface LabArgs {
  clip: BadmintonClip;
  /** Seconds into the clip (held at its end past it). */
  t: number;
  /** Plays the clip on a loop in real time instead. */
  playing: boolean;
  view: keyof typeof VIEWS;
  layout: "stage" | "column";
}

/**
 * Where the shuttle is at `t` in the lab: hanging from the left hand, then falling onto the racket (the serve), or
 * coming in to the contact point and going back out; none away from contact.
 */
function shuttleAt(
  clip: BadmintonClip,
  t: number,
  reach: Reach,
): { at: Vector3; heading: Vector3 } | null {
  if (clip === "serve") {
    if (t > SERVE_CLIP.contact + 0.05) return null;
    const fall = Math.max(0, t - SERVE_CLIP.drop);
    // Dropped from rest: gravity with the same drag as in flight (shuttle.ts).
    const drop = GRAVITY * TAU * (fall - TAU * (1 - Math.exp(-fall / TAU)));
    const [x, y, z] = reach.hold;
    return { at: new Vector3(x, y - drop, z), heading: new Vector3(0, -1, 0) };
  }
  const stroke = STROKES[clip];
  if (!stroke || Math.abs(t - stroke.at) > 0.06) return null;
  const [x, y, z] = reach[stroke.reach];
  return { at: new Vector3(x, y, z), heading: new Vector3(0, -0.5, -0.85).normalize() };
}

/** Shows the shuttle where `s` says, cork first along its heading, or hides it. */
function placeShuttle(shuttle: Group, s: ReturnType<typeof shuttleAt>) {
  shuttle.visible = s !== null;
  if (!s) return;
  shuttle.position.copy(s.at);
  shuttle.lookAt(s.at.clone().add(s.heading));
}

/** Yash in his kit with the racket and bands, posed at `t` (or playing), and the shuttle at the measured contact. */
function LabScene({ assets, clip, t, playing, view, layout }: LabArgs & { assets: LabAssets }) {
  const shadows = SETTINGS[layout].shadows;
  const c = useMemo(
    () => ({
      court: tokenColor("--ref-court-hall"),
      line: tokenColor("--ref-floodlight"),
      sky: tokenColor("--ref-led-white"),
      lamp: tokenColor("--ref-lamp"),
    }),
    [],
  );
  const cast = useMemo(() => {
    const dark = tokenColor("--surface-panel");
    const props = makeBadmintonProps({
      volt: tokenColor("--ref-volt"),
      dark: tokenColor("--ref-stand-hi"),
      light: tokenColor("--ref-floodlight"),
    });
    const a = makeAthlete(
      assets,
      {
        shirt: dark,
        trousers: dark,
        shoes: tokenColor("--ref-floodlight"),
        shorts: true,
        eyes: tokenColor("--ref-night"),
      },
      assets.clips,
    );
    props.racket(a, "volt");
    props.headband(a);
    props.wristband(a);
    const shuttle = props.shuttle();
    return { a, props, shuttle };
  }, [assets]);
  useEffect(
    () => () => {
      cast.props.dispose();
      cast.a.materials.forEach((m) => m.dispose());
      cast.a.mixer.stopAllAction();
    },
    [cast],
  );
  const light = useMemo(() => {
    const l = new DirectionalLight(c.lamp, 2.2);
    l.position.set(-6, 12, 8);
    l.castShadow = shadows;
    l.shadow.mapSize.set(1024, 1024);
    Object.assign(l.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 });
    l.shadow.camera.updateProjectionMatrix();
    return l;
  }, [c, shadows]);
  useFrame(({ clock, camera }) => {
    const pose = VIEWS[view];
    camera.position.set(...pose.position);
    camera.lookAt(...pose.target);
    const time = playing ? clock.getElapsedTime() : t;
    applyClips(cast.a, [{ clip, time, weight: 1, loop: playing }]);
    const duration = cast.a.actions[clip]?.getClip().duration ?? 1;
    const s = shuttleAt(clip, playing ? time % duration : Math.min(time, duration), assets.reach);
    placeShuttle(cast.shuttle, s);
  });
  return (
    <>
      <hemisphereLight args={[c.sky, c.court, 1.3]} />
      <primitive object={light} />
      <primitive object={light.target} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color={c.court} roughness={0.9} />
      </mesh>
      {/* A line across in front of him, and one along under him, to judge where the feet are. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 1]}>
        <planeGeometry args={[COURT.singles * 2, COURT.line]} />
        <meshBasicMaterial color={c.line} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0.5]}>
        <planeGeometry args={[COURT.line, 6]} />
        <meshBasicMaterial color={c.line} />
      </mesh>
      <primitive object={cast.a.root} />
      <primitive object={cast.shuttle} />
    </>
  );
}

/** One athlete in the badminton kit on a plain court, frozen at one moment of one move, for tuning the poses (dev only). */
function PoseLab(args: LabArgs) {
  const [assets, setAssets] = useState<LabAssets | null>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    let live = true;
    loadAthleteFiles(() => {})
      .then((files) => prepareAthlete(files, buildBadmintonClips))
      .then((a) => live && setAssets({ ...a, reach: measureReach(a, a.clips) }));
    return () => {
      live = false;
    };
  }, []);
  const size = args.layout === "stage" ? { width: 1440, height: 900 } : { width: 390, height: 844 };
  return (
    <div className="relative bg-night" style={size} data-ready={drawn ? "true" : "false"}>
      {assets ? (
        <GameCanvas
          key={args.layout}
          layout={args.layout}
          fov={32}
          position={VIEWS[args.view].position}
          antialias
          onDrawn={() => setDrawn(true)}
        >
          <LabScene assets={assets} {...args} />
        </GameCanvas>
      ) : null}
    </div>
  );
}

const meta: Meta<LabArgs> = {
  title: "Dev/Badminton Pose Lab",
  component: PoseLab,
  parameters: { layout: "fullscreen" },
  args: {
    clip: "overhead",
    t: OVERHEAD_CLIP.contact,
    playing: false,
    view: "side",
    layout: "stage",
  },
  argTypes: {
    clip: { control: "select", options: CLIPS },
    t: { control: { type: "range", min: 0, max: LONGEST, step: 0.01 } },
    playing: { control: "boolean" },
    view: { control: "inline-radio", options: Object.keys(VIEWS) },
    layout: { control: "inline-radio", options: ["stage", "column"] },
  },
};
export default meta;

export const Lab: StoryObj<LabArgs> = {};
