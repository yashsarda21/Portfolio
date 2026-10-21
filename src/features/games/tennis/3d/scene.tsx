import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef, type RefObject } from "react";
import { Vector3, type AnimationClip, type Mesh, type Texture } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { loadAthleteFiles, nextTask, prepareAthlete } from "../../three/assets";
import { CameraRig } from "../../three/CameraRig";
import { FloorShadow } from "../../three/FloorShadow";
import { GameCanvas } from "../../three/GameCanvas";
import { tokenColor } from "../../three/tokens";
import type { Vec3 } from "../../three/track";
import type { SceneProps } from "../../three/useThreeScreen";
import { Arena } from "./Arena";
import { BALL_RADIUS, CAMERA } from "./court";
import { buildTennisClips } from "./moves";
import { Players, type YashHand } from "./Players";
import { measureReach, type Reach } from "./reach";
import { PALM } from "./sequence";
import type { WorldState } from "./world";

export interface TennisAssets {
  body: GLTF;
  /** Every tennis clip (the made ones and the free pack's), built once and shared by both players. */
  clips: AnimationClip[];
  skin: Texture;
  /** Where each stroke's racket and Yash's hand are in the body's frame (see `measureReach`). */
  reach: Reach;
}

/**
 * The three files, then the clips are built (shared by both players), the body's skinned bounds are measured (see
 * `prepareAthlete`), and the reach is measured on a throwaway athlete, a task of its own.
 */
export async function loadTennisAssets(
  onProgress: (fraction: number) => void,
): Promise<TennisAssets> {
  const files = await loadAthleteFiles(onProgress);
  const made = await prepareAthlete(files, buildTennisClips);
  await nextTask();
  return { ...made, reach: measureReach(made, made.clips) };
}

/** The ball is drawn at twice its real size so it reads on screen. */
const BALL_DRAWN = BALL_RADIUS * 2;
/** The shadow under the ball: its radius (m), how dark at the floor, and the height (m) at which it has faded away. */
const BALL_SHADOW = { radius: 0.11, opacity: 0.45, fadeBy: 4 } as const;
const HERE = new Vector3();
const PALM_AT = new Vector3();
const AXIS_Y = new Vector3(0, 1, 0);

/**
 * The ball: at the shotlist's place, or in Yash's left palm while he holds it (the same palm offset the toss starts
 * from, so there is no jump), or hidden. `placedRef` is told where it is each frame (null while hidden), for its shadow.
 */
function Ball({
  world,
  yashHand,
  placedRef,
}: {
  world: RefObject<WorldState | null>;
  yashHand: RefObject<YashHand | null>;
  placedRef: RefObject<Vec3 | null>;
}) {
  const ball = useRef<Mesh>(null);
  const volt = useMemo(() => tokenColor("--ref-volt"), []);
  useFrame(() => {
    const w = world.current;
    const b = ball.current;
    if (!w || !b) return;
    const t = w.elapsed();
    const held = w.shotlist.held(t);
    const hand = yashHand.current;
    let at: Vec3 | null = null;
    if (held === "yash" && hand) {
      // The palm: the hand bone plus the shotlist's offset, in Yash's own frame.
      hand.hand.updateWorldMatrix(true, false);
      hand.hand.getWorldPosition(HERE);
      PALM_AT.set(...PALM).applyAxisAngle(AXIS_Y, hand.root.rotation.y);
      HERE.add(PALM_AT);
      at = [HERE.x, HERE.y, HERE.z];
    } else if (!held) {
      at = w.shotlist.ball(t);
    }
    placedRef.current = at;
    b.visible = at !== null;
    if (at) b.position.set(...at);
  });
  return (
    <mesh ref={ball} visible={false}>
      <sphereGeometry args={[BALL_DRAWN, 16, 12]} />
      <meshStandardMaterial color={volt} emissive={volt} emissiveIntensity={0.35} />
    </mesh>
  );
}

/**
 * The 3D tennis court: the arena, the two players, the ball and the camera, drawn from `world` each frame.
 * `onShown`: its shaders are compiled and it is drawing (until then the game keeps its loader up); `onDrawn`: its
 * first frame is on the canvas (until then the board keeps its backdrop).
 */
export function TennisScene({
  assets,
  world,
  layout,
  onShown,
  onDrawn,
}: SceneProps<TennisAssets, WorldState>) {
  const yashHand = useRef<YashHand | null>(null);
  const ballAt = useRef<Vec3 | null>(null);
  const onYash = useCallback((yash: YashHand | null) => {
    yashHand.current = yash;
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
      <Arena layout={layout} world={world} />
      <Players assets={assets} world={world} layout={layout} onYash={onYash} />
      <Ball world={world} yashHand={yashHand} placedRef={ballAt} />
      <FloorShadow at={() => ballAt.current} {...BALL_SHADOW} />
      <CameraRig world={world} layout={layout} tilt={CAMERA.tilt} fov={CAMERA.fov} />
    </GameCanvas>
  );
}
