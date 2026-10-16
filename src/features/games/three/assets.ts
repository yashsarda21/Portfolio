import {
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type AnimationClip,
  type SkinnedMesh,
  type Texture,
} from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { restPose } from "./athlete";
import { MODEL_FILES } from "./rig";

/** The next task: each start-up step gets one of its own, so none holds the main thread for long. */
export const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** The three files every athlete is made from: the body, the free moves pack, and the skin. */
export interface AthleteFiles {
  body: GLTF;
  moves: AnimationClip[];
  skin: Texture;
}

/** The three files (body, moves, skin), fetched together; progress is the mean of each file's share loaded. */
export async function loadAthleteFiles(
  onProgress: (fraction: number) => void,
): Promise<AthleteFiles> {
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
  return { body, moves: moves.animations, skin };
}

/**
 * The start-up steps after the download, a task each: the game's clips are built, and the body's skinned bounds are
 * measured once (every player's clone copies them, so the first frame does not measure every body vertex by vertex).
 */
export async function prepareAthlete(
  files: AthleteFiles,
  buildClips: (rest: ReturnType<typeof restPose>, moves: AnimationClip[]) => AnimationClip[],
): Promise<{ body: GLTF; clips: AnimationClip[]; skin: Texture }> {
  await nextTask();
  const clips = buildClips(restPose(files.body.scene), files.moves);
  await nextTask();
  files.body.scene.traverse((o) => {
    if ((o as SkinnedMesh).isSkinnedMesh) (o as SkinnedMesh).computeBoundingSphere();
  });
  return { body: files.body, clips, skin: files.skin };
}
