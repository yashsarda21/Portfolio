import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import {
  AdditiveBlending,
  CanvasTexture,
  Group,
  Vector3,
  type AnimationClip,
  type Sprite,
  type Texture,
} from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import type { GameLayout } from "../../engine/types";
import { loadAthleteFiles, nextTask, prepareAthlete } from "../../three/assets";
import { CameraRig } from "../../three/CameraRig";
import { FloorShadow } from "../../three/FloorShadow";
import { GameCanvas } from "../../three/GameCanvas";
import { clamp, smooth } from "../../three/geometry";
import { tokenColor } from "../../three/tokens";
import type { Vec3 } from "../../three/track";
import type { SceneProps } from "../../three/useThreeScreen";
import { CAMERA } from "./court";
import { Hall } from "./Hall";
import { buildBadmintonClips } from "./moves";
import { Players, type LeftHands } from "./Players";
import { makeBadmintonProps } from "./props";
import { DRAWN } from "./shuttle";
import { HANG, measureReach, PINCH, type Reach } from "./reach";
import type { WorldState } from "./world";

export interface BadmintonAssets {
  body: GLTF;
  /** Every badminton clip (the made ones and the free pack's), built once and shared by both players. */
  clips: AnimationClip[];
  skin: Texture;
  /** Where each stroke's racket sweet spot and the server's shuttle are in the body's frame (see `measureReach`). */
  reach: Reach;
}

/**
 * The three files, then the clips are built (shared by both players), the body's skinned bounds are measured (see
 * `prepareAthlete`), and the reach is measured on a throwaway athlete, a task of its own.
 */
export async function loadBadmintonAssets(
  onProgress: (fraction: number) => void,
): Promise<BadmintonAssets> {
  const files = await loadAthleteFiles(onProgress);
  const made = await prepareAthlete(files, buildBadmintonClips);
  await nextTask();
  return { ...made, reach: measureReach(made, made.clips) };
}

/**
 * How many times real size the shuttle is drawn in flight, per layout (so it reads on a phone), and the soft halo's
 * width around it (m) per unit of that size. In the server's hand it is drawn at `DRAWN`, then it grows to this over
 * `GROW_S` as it falls.
 */
const DRAWN_BY: Record<GameLayout, number> = { stage: 2.2, column: 3.0 };
const HALO = { width: 0.1, opacity: 0.4 } as const;
const GROW_S = 0.3;
/** The shadow under the shuttle at `DRAWN` times real size (it scales with the drawn size): radius (m), how dark at the floor, and the height (m) it has faded away by. */
const SHUTTLE_SHADOW = { radius: 0.09, opacity: 0.4, fadeBy: 5 } as const;
const HERE = new Vector3();
const AHEAD = new Vector3();
const DOWN = new Vector3(0, -1, 0);

/** A soft round fade (white in the middle, clear at the rim), used as the halo's picture. */
function glowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const g = canvas.getContext("2d")!;
  const fade = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  const white = tokenColor("--ref-white");
  fade.addColorStop(0, white.getStyle());
  fade.addColorStop(0.35, white.clone().multiplyScalar(0.5).getStyle());
  fade.addColorStop(1, tokenColor("--ref-night").getStyle());
  g.fillStyle = fade;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(canvas);
}

/**
 * The shuttle: at the shotlist's place with the cork along its heading, or hanging cork down from the server's left
 * fingers while he holds it (the same pinch the serve lets go from, so there is no jump), or hidden. It has a faint
 * soft halo so it reads against the court. `placedRef` is told where it is each frame (null while hidden), for its
 * shadow.
 */
function Shuttle({
  world,
  hands,
  placedRef,
  layout,
}: {
  world: RefObject<WorldState | null>;
  hands: RefObject<LeftHands | null>;
  placedRef: RefObject<Vec3 | null>;
  layout: GameLayout;
}) {
  const props = useMemo(
    () =>
      makeBadmintonProps({
        volt: tokenColor("--ref-volt"),
        dark: tokenColor("--ref-stand-hi"),
        light: tokenColor("--ref-white"),
      }),
    [],
  );
  const shuttle = useMemo<Group>(() => props.shuttle(), [props]);
  const glow = useMemo(() => glowTexture(), []);
  const white = useMemo(() => tokenColor("--ref-white"), []);
  useEffect(
    () => () => {
      props.dispose();
      glow.dispose();
    },
    [props, glow],
  );
  const holder = useRef<Group>(null);
  const sized = useRef<Group>(null);
  const halo = useRef<Sprite>(null);
  const since = useRef(-Infinity);
  const drawn = DRAWN_BY[layout];
  useFrame(() => {
    const w = world.current;
    const g = holder.current;
    const body = sized.current;
    const h = halo.current;
    if (!w || !g || !body || !h) return;
    const t = w.elapsed();
    const held = w.shotlist.held(t);
    const hand = held ? hands.current?.[held] : undefined;
    let at: Vec3 | null = null;
    // Real-hand size while held, growing to the layout's size over GROW_S once let go.
    if (held) since.current = t;
    const grown = held ? 0 : smooth(clamp((t - since.current) / GROW_S, 0, 1));
    const size = DRAWN + (drawn - DRAWN) * grown;
    if (held && hand) {
      // The fingers' pinch in the hand's frame, the shuttle hanging cork down from it.
      hand.updateWorldMatrix(true, false);
      HERE.set(...PINCH).applyMatrix4(hand.matrixWorld);
      HERE.y -= HANG;
      g.position.copy(HERE);
      g.lookAt(AHEAD.copy(HERE).add(DOWN));
      at = [HERE.x, HERE.y, HERE.z];
    } else if (!held) {
      const s = w.shotlist.shuttle(t);
      if (s) {
        g.position.set(...s.at);
        g.lookAt(AHEAD.set(...s.at).add(HERE.set(...s.heading)));
        at = s.at;
      }
    }
    // The shuttle is built at DRAWN; the halo is as wide as the drawn size says.
    body.scale.setScalar(size / DRAWN);
    h.scale.setScalar(HALO.width * size * 2);
    placedRef.current = at;
    g.visible = at !== null;
  });
  return (
    <group ref={holder} visible={false}>
      <group ref={sized}>
        <primitive object={shuttle} />
      </group>
      <sprite ref={halo}>
        <spriteMaterial
          map={glow}
          color={white}
          transparent
          opacity={HALO.opacity}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </sprite>
    </group>
  );
}

/**
 * The 3D badminton hall: the hall, the two players, the shuttle and the camera, drawn from `world` each frame.
 * `onShown`: its shaders are compiled and it is drawing (until then the game keeps its loader up); `onDrawn`: its
 * first frame is on the canvas (until then the board keeps its backdrop).
 */
export function BadmintonScene({
  assets,
  world,
  layout,
  onShown,
  onDrawn,
}: SceneProps<BadmintonAssets, WorldState>) {
  const hands = useRef<LeftHands | null>(null);
  const shuttleAt = useRef<Vec3 | null>(null);
  const onHands = useCallback((h: LeftHands | null) => {
    hands.current = h;
  }, []);
  return (
    <GameCanvas
      layout={layout}
      fov={CAMERA.fov[layout]}
      position={CAMERA.tv.position}
      antialias
      onShown={onShown}
      onDrawn={onDrawn}
    >
      <Hall layout={layout} world={world} />
      <Players assets={assets} world={world} layout={layout} onHands={onHands} />
      <Shuttle world={world} hands={hands} placedRef={shuttleAt} layout={layout} />
      <FloorShadow
        at={() => shuttleAt.current}
        {...SHUTTLE_SHADOW}
        radius={(SHUTTLE_SHADOW.radius * DRAWN_BY[layout]) / DRAWN}
      />
      <CameraRig world={world} layout={layout} tilt={CAMERA.tilt} fov={CAMERA.fov} />
    </GameCanvas>
  );
}
