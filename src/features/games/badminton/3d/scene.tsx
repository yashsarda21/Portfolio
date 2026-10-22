import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import { Group, Vector3, type AnimationClip, type Texture } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { loadAthleteFiles, nextTask, prepareAthlete } from "../../three/assets";
import { CameraRig } from "../../three/CameraRig";
import { FloorShadow } from "../../three/FloorShadow";
import { GameCanvas } from "../../three/GameCanvas";
import { tokenColor } from "../../three/tokens";
import type { Vec3 } from "../../three/track";
import type { SceneProps } from "../../three/useThreeScreen";
import { CAMERA } from "./court";
import { Hall } from "./Hall";
import { buildBadmintonClips } from "./moves";
import { Players, type LeftHands } from "./Players";
import { makeBadmintonProps } from "./props";
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

/** The shadow under the shuttle: its radius (m), how dark at the floor, and the height (m) at which it has faded away. */
const SHUTTLE_SHADOW = { radius: 0.09, opacity: 0.4, fadeBy: 5 } as const;
const HERE = new Vector3();
const AHEAD = new Vector3();
const DOWN = new Vector3(0, -1, 0);

/**
 * The shuttle: at the shotlist's place with the cork along its heading, or hanging cork down from the server's left
 * fingers while he holds it (the same pinch the serve lets go from, so there is no jump), or hidden. `placedRef` is
 * told where it is each frame (null while hidden), for its shadow.
 */
function Shuttle({
  world,
  hands,
  placedRef,
}: {
  world: RefObject<WorldState | null>;
  hands: RefObject<LeftHands | null>;
  placedRef: RefObject<Vec3 | null>;
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
  const holder = useRef<Group>(null);
  useEffect(() => () => props.dispose(), [props]);
  useFrame(() => {
    const w = world.current;
    const g = holder.current;
    if (!w || !g) return;
    const t = w.elapsed();
    const held = w.shotlist.held(t);
    const hand = held ? hands.current?.[held] : undefined;
    let at: Vec3 | null = null;
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
    placedRef.current = at;
    g.visible = at !== null;
  });
  return (
    <group ref={holder} visible={false}>
      <primitive object={shuttle} />
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
      <Shuttle world={world} hands={hands} placedRef={shuttleAt} />
      <FloorShadow at={() => shuttleAt.current} {...SHUTTLE_SHADOW} />
      <CameraRig world={world} layout={layout} tilt={CAMERA.tilt} fov={CAMERA.fov} />
    </GameCanvas>
  );
}
