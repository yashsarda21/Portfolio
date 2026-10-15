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
  type Texture,
} from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import type { GameLayout } from "../../engine/types";
import { GameCanvas } from "../../three/GameCanvas";
import { MODEL_FILES } from "../../three/rig";
import { tokenColor } from "../../three/tokens";
import { BALL_RADIUS, CAMERA } from "./field";
import { Players } from "./Players";
import { Stadium } from "./Stadium";
import type { WorldState } from "./world";

export interface CricketAssets {
  body: GLTF;
  moves: AnimationClip[];
  skin: Texture;
}

/** The three files (body, moves, skin), fetched together; progress is the mean of each file's share loaded. */
export function loadCricketAssets(onProgress: (fraction: number) => void): Promise<CricketAssets> {
  const done = [0, 0, 0];
  const report = (i: number, fraction: number) => {
    done[i] = Math.min(1, Math.max(done[i]!, fraction));
    onProgress((done[0]! + done[1]! + done[2]!) / 3);
  };
  const share = (i: number) => (e: ProgressEvent) => {
    if (e.total > 0) report(i, e.loaded / e.total);
  };
  const gltf = new GLTFLoader();
  return Promise.all([
    gltf.loadAsync(MODEL_FILES.body, share(0)).then((g) => (report(0, 1), g)),
    gltf.loadAsync(MODEL_FILES.moves, share(1)).then((g) => (report(1, 1), g)),
    new TextureLoader().loadAsync(MODEL_FILES.skin, share(2)).then((t) => (report(2, 1), t)),
  ]).then(([body, moves, skin]) => {
    skin.colorSpace = SRGBColorSpace;
    skin.flipY = false;
    skin.wrapS = skin.wrapT = RepeatWrapping;
    return { body, moves: moves.animations, skin };
  });
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
    const [ax, ay, az] = CAMERA.aim.position;
    const away = Math.min(1, camera.position.distanceTo(new Vector3(ax, ay, az)) / FOLLOW_OPEN_M);
    const fov = MathUtils.lerp(CAMERA.fov[layout], CAMERA.followFov[layout], away);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

/** The 3D cricket ground: the stadium, the seven players, the ball and the camera, drawn from `world` each frame. */
export function CricketScene({
  assets,
  world,
  layout,
}: {
  assets: CricketAssets;
  world: RefObject<WorldState | null>;
  layout: GameLayout;
}) {
  return (
    <GameCanvas layout={layout} fov={CAMERA.fov[layout]} position={CAMERA.aim.position}>
      <Stadium layout={layout} world={world} />
      <Players assets={assets} world={world} layout={layout} />
      <Ball world={world} />
      <CameraRig world={world} layout={layout} />
    </GameCanvas>
  );
}
