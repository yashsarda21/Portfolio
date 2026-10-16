import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import {
  MathUtils,
  PerspectiveCamera,
  Vector3,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type AnimationClip,
  type Mesh,
  type SkinnedMesh,
  type Texture,
} from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import type { GameLayout } from "../../engine/types";
import { GameCanvas } from "../../three/GameCanvas";
import { restPose } from "../../three/athlete";
import { MODEL_FILES } from "../../three/rig";
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

/** The next task: each start-up step gets one of its own, so none holds the main thread for long. */
const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * The three files (body, moves, skin), fetched together; progress is the mean of each file's share loaded. Then, a
 * task each: the clips are built, and the body's skinned bounds are measured once (every player's clone copies them,
 * so the first frame does not measure seven bodies vertex by vertex).
 */
export async function loadCricketAssets(
  onProgress: (fraction: number) => void,
): Promise<CricketAssets> {
  const done = [0, 0, 0];
  const report = (i: number, fraction: number) => {
    done[i] = Math.min(1, Math.max(done[i]!, fraction));
    onProgress((done[0]! + done[1]! + done[2]!) / 3);
  };
  const share = (i: number) => (e: ProgressEvent) => {
    if (e.total > 0) report(i, e.loaded / e.total);
  };
  const gltf = new GLTFLoader();
  const [body, moves, skin] = await Promise.all([
    gltf.loadAsync(MODEL_FILES.body, share(0)).then((g) => (report(0, 1), g)),
    gltf.loadAsync(MODEL_FILES.moves, share(1)).then((g) => (report(1, 1), g)),
    new TextureLoader().loadAsync(MODEL_FILES.skin, share(2)).then((t) => (report(2, 1), t)),
  ]);
  skin.colorSpace = SRGBColorSpace;
  skin.flipY = false;
  skin.wrapS = skin.wrapT = RepeatWrapping;
  await nextTask();
  const clips = buildCricketClips(restPose(body.scene), moves.animations);
  await nextTask();
  body.scene.traverse((o) => {
    if ((o as SkinnedMesh).isSkinnedMesh) (o as SkinnedMesh).computeBoundingSphere();
  });
  return { body, clips, skin };
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
 * `onShown`: its shaders are compiled and it is drawing (until then the game keeps its loader up).
 */
export function CricketScene({
  assets,
  world,
  layout,
  onShown,
}: {
  assets: CricketAssets;
  world: RefObject<WorldState | null>;
  layout: GameLayout;
  onShown?: () => void;
}) {
  return (
    <GameCanvas
      layout={layout}
      fov={CAMERA.fov[layout]}
      position={CAMERA.aim.position}
      onShown={onShown}
    >
      <Stadium layout={layout} world={world} />
      <Players assets={assets} world={world} layout={layout} />
      <Ball world={world} />
      <CameraRig world={world} layout={layout} />
    </GameCanvas>
  );
}
