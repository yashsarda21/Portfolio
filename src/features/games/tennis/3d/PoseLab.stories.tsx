import { useFrame } from "@react-three/fiber";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useMemo, useState } from "react";
import { DirectionalLight, type AnimationClip, type Texture } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { applyClips, makeAthlete } from "../../three/athlete";
import { loadAthleteFiles, prepareAthlete } from "../../three/assets";
import { GameCanvas } from "../../three/GameCanvas";
import { SETTINGS } from "../../three/settings";
import { tokenColor } from "../../three/tokens";
import { COURT, type CameraPose } from "./court";
import { buildTennisClips } from "./moves";
import { makeTennisProps } from "./props";
import { measureReach, type Reach } from "./reach";
import type { TennisClip } from "./timing";

interface LabAssets {
  body: GLTF;
  clips: AnimationClip[];
  skin: Texture;
  reach: Reach;
}

/** The baseline in front of the athlete, as far ahead of his feet as at Yash's serve spot. */
const BASELINE_Z = 0.315;
/** Views for judging a pose of the athlete at the origin facing +z (`tv`: from where the broadcast camera sees you, aimed lower so you fill more of the frame). */
const VIEWS: Record<"front" | "side" | "back" | "tv", CameraPose> = {
  front: { position: [0, 1.4, 5.5], target: [0, 1.05, 0] },
  side: { position: [-5.5, 1.3, 0.25], target: [0, 1.05, 0.25] },
  back: { position: [0, 1.6, -5.5], target: [0, 1.05, 0] },
  tv: { position: [0, 7.6, -12.3], target: [0, 0.4, 6] },
};
const STROKES: Partial<Record<TennisClip, keyof Reach>> = {
  forehand: "forehand",
  backhand: "backhand",
  serve: "serve",
};
const CLIPS: TennisClip[] = [
  "ready",
  "split",
  "shuffleL",
  "shuffleR",
  "bounceBall",
  "serve",
  "forehand",
  "backhand",
  "stretchF",
  "stretchB",
  "fistPump",
  "idle",
  "walk",
  "jog",
  "sprint",
  "crouch",
];

interface LabArgs {
  clip: TennisClip;
  /** Seconds into the clip (held at its end past it). */
  t: number;
  /** Plays the clip on a loop in real time instead. */
  playing: boolean;
  view: keyof typeof VIEWS;
  layout: "stage" | "column";
}

/** Yash in his kit with the racket and bands, posed at `t` (or playing), and the measured contact point. */
function LabScene({ assets, clip, t, playing, view, layout }: LabArgs & { assets: LabAssets }) {
  const shadows = SETTINGS[layout].shadows;
  const c = useMemo(
    () => ({
      court: tokenColor("--ref-court-hard"),
      line: tokenColor("--ref-floodlight"),
      volt: tokenColor("--ref-volt"),
      sky: tokenColor("--ref-led-white"),
      lamp: tokenColor("--ref-lamp"),
    }),
    [],
  );
  const cast = useMemo(() => {
    const dark = tokenColor("--surface-panel");
    const props = makeTennisProps({
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
    return { a, props };
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
  });
  const mark = STROKES[clip];
  return (
    <>
      <hemisphereLight args={[c.sky, c.court, 1.3]} />
      <primitive object={light} />
      <primitive object={light.target} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color={c.court} roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, BASELINE_Z + COURT.line / 2]}>
        <planeGeometry args={[COURT.singles * 2, COURT.line]} />
        <meshBasicMaterial color={c.line} />
      </mesh>
      <primitive object={cast.a.root} />
      {mark ? (
        <mesh position={assets.reach[mark]}>
          <sphereGeometry args={[0.033, 16, 12]} />
          <meshBasicMaterial color={c.volt} />
        </mesh>
      ) : null}
    </>
  );
}

/** One athlete in the tennis kit on a plain court, frozen at one moment of one move, for tuning the poses (dev only). */
function PoseLab(args: LabArgs) {
  const [assets, setAssets] = useState<LabAssets | null>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    let live = true;
    loadAthleteFiles(() => {})
      .then((files) => prepareAthlete(files, buildTennisClips))
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
          onDrawn={() => setDrawn(true)}
        >
          <LabScene assets={assets} {...args} />
        </GameCanvas>
      ) : null}
    </div>
  );
}

const meta: Meta<LabArgs> = {
  title: "Dev/Tennis Pose Lab",
  component: PoseLab,
  parameters: { layout: "fullscreen" },
  args: { clip: "forehand", t: 0.6, playing: false, view: "front", layout: "stage" },
  argTypes: {
    clip: { control: "select", options: CLIPS },
    t: { control: { type: "range", min: 0, max: 1.9, step: 0.01 } },
    playing: { control: "boolean" },
    view: { control: "inline-radio", options: Object.keys(VIEWS) },
    layout: { control: "inline-radio", options: ["stage", "column"] },
  },
};
export default meta;

export const Lab: StoryObj<LabArgs> = {};
