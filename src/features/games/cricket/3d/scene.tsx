import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import {
  MathUtils,
  PerspectiveCamera,
  Vector3,
  type AnimationClip,
  type Mesh,
  type Texture,
} from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import type { GameLayout } from "../../engine/types";
import { loadAthleteFiles, prepareAthlete } from "../../three/assets";
import { GameCanvas } from "../../three/GameCanvas";
import type { SceneProps } from "../../three/useThreeScreen";
import { tokenColor } from "../../three/tokens";
import { BALL_RADIUS, CAMERA } from "./field";
import { Players } from "./Players";
import { buildCricketClips } from "./shots";
import { Stadium } from "./Stadium";
import type { WorldState } from "./world";

export interface CricketAssets {
  body: GLTF;
  /** Every cricket clip (the made ones and the free pack's), built once and shared by the seven players. */
  clips: AnimationClip[];
  skin: Texture;
}

/**
 * The three files, then the clips are built (once, shared by the seven players) and the body's skinned bounds are
 * measured (see `prepareAthlete`).
 */
export async function loadCricketAssets(
  onProgress: (fraction: number) => void,
): Promise<CricketAssets> {
  const files = await loadAthleteFiles(onProgress);
  return prepareAthlete(files, buildCricketClips);
}

/** The ball, drawn three times its real size so it reads on screen; hidden when the shotlist has none. */
function Ball({ world }: { world: RefObject<WorldState | null> }) {
  const ball = useRef<Mesh>(null);
  useFrame(() => {
    const w = world.current;
    const b = ball.current;
    if (!w || !b) return;
    const at = w.shotlist.ball(w.elapsed());
    b.visible = at !== null;
    if (at) b.position.set(...at);
  });
  const white = tokenColor("--ref-white");
  return (
    <mesh ref={ball} visible={false} castShadow>
      <sphereGeometry args={[BALL_RADIUS * 3, 16, 12]} />
      <meshStandardMaterial color={white} emissive={white} emissiveIntensity={0.35} />
    </mesh>
  );
}

/** How far (m) the camera must move from the TV view before the lens is fully open. */
const FOLLOW_OPEN_M = 10;
/** The TV view's camera position, made once (the rig runs every frame). */
const AIM = new Vector3(...CAMERA.aim.position);

/** The camera, set every frame from the shotlist's camera (the TV view, then the follow). */
function CameraRig({ world, layout }: { world: RefObject<WorldState | null>; layout: GameLayout }) {
  useFrame(({ camera }) => {
    const w = world.current;
    if (!w || !(camera instanceof PerspectiveCamera)) return;
    const pose = w.shotlist.camera(w.elapsed());
    camera.position.set(...pose.position);
    camera.lookAt(...pose.target);
    // The column frames the same view a little higher, clear of the thumb zone.
    camera.rotateX(-MathUtils.degToRad(CAMERA.tilt[layout]));
    // Away from the TV view (following the ball), the lens opens up.
    const away = Math.min(1, camera.position.distanceTo(AIM) / FOLLOW_OPEN_M);
    const fov = MathUtils.lerp(CAMERA.fov[layout], CAMERA.followFov[layout], away);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

/**
 * The 3D cricket ground: the stadium, the seven players, the ball and the camera, drawn from `world` each frame.
 * `onShown`: its shaders are compiled and it is drawing (until then the game keeps its loader up); `onDrawn`: its
 * first frame is on the canvas (until then the board keeps its backdrop).
 */
export function CricketScene({
  assets,
  world,
  layout,
  onShown,
  onDrawn,
}: SceneProps<CricketAssets, WorldState>) {
  return (
    <GameCanvas
      layout={layout}
      fov={CAMERA.fov[layout]}
      position={CAMERA.aim.position}
      onShown={onShown}
      onDrawn={onDrawn}
    >
      <Stadium layout={layout} world={world} />
      <Players assets={assets} world={world} layout={layout} />
      <Ball world={world} />
      <CameraRig world={world} layout={layout} />
    </GameCanvas>
  );
}
