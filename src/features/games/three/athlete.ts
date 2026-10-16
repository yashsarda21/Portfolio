import {
  AnimationMixer,
  Group,
  MeshStandardMaterial,
  type AnimationAction,
  type AnimationClip,
  type Bone,
  type Color,
  type Material,
  type Mesh,
  type Object3D,
  type Texture,
  Quaternion,
} from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { kitMaterial, type Kit } from "./kitMaterial";
import type { HipsRest } from "./poseClip";
import { BONES, MODEL_SCALE, MODEL_YAW, type BoneKey, type LIBRARY_CLIPS } from "./rig";
import type { ClipSample } from "./track";

export interface AthleteAssets {
  body: GLTF;
  skin: Texture;
}
export interface Athlete {
  /** Placed and turned by the scene (it faces +z at rest). */
  root: Group;
  /** Inside `root`: the body, turned and scaled to face +z in metres, and lifted so the feet meet the floor. */
  body: Group;
  mixer: AnimationMixer;
  actions: Record<string, AnimationAction>;
  bone(key: BoneKey): Bone;
  /** The materials made for this athlete (the geometry is shared): the scene disposes them. */
  materials: Material[];
}

/**
 * How far each free clip sinks the feet into the floor on this body (the clips' hips track was made for a slightly
 * shorter rig), measured as the lowest sole over the whole cycle: lifted by this much (m) so the planted foot meets the
 * floor. Clips made from key poses place the feet on the floor themselves.
 */
export const CLIP_LIFT: Record<keyof typeof LIBRARY_CLIPS, number> = {
  idle: 0.053,
  walk: 0.05,
  jog: 0.039,
  sprint: 0.052,
  crouch: 0.01,
};

/** One player: a clone of the body in a painted kit, with one mixer action per clip (all playing, at weight 0). */
export function makeAthlete(
  assets: AthleteAssets,
  kit: Kit & { eyes: Color },
  clips: readonly AnimationClip[],
): Athlete {
  const model = clone(assets.body.scene);
  const skin = kitMaterial(assets.skin, kit);
  const eyes = new MeshStandardMaterial({ color: kit.eyes, roughness: 0.4 });
  model.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    mesh.material = mesh.name === "SuperHero_Male" ? skin : eyes;
    mesh.castShadow = mesh.name === "SuperHero_Male";
    // A pose can carry the body far from its rest-pose bounds (a dive): never cull it.
    mesh.frustumCulled = false;
  });
  const body = new Group();
  body.rotation.y = MODEL_YAW;
  body.scale.setScalar(MODEL_SCALE);
  body.add(model);
  const root = new Group();
  root.add(body);

  const mixer = new AnimationMixer(model);
  const actions: Record<string, AnimationAction> = {};
  for (const clip of clips) {
    const action = mixer.clipAction(clip);
    action.weight = 0;
    action.play();
    actions[clip.name] = action;
  }
  const bones = {} as Record<BoneKey, Bone>;
  for (const key of Object.keys(BONES) as BoneKey[]) {
    bones[key] = model.getObjectByName(BONES[key]) as Bone;
  }
  return { root, body, mixer, actions, bone: (key) => bones[key], materials: [skin, eyes] };
}

/** Poses the athlete from its clip samples (`sampleTrack`): each clip at its time and weight, the rest at weight 0. */
export function applyClips(athlete: Athlete, samples: readonly ClipSample[]): void {
  for (const name in athlete.actions) athlete.actions[name]!.weight = 0;
  let lift = 0;
  for (const s of samples) {
    const action = athlete.actions[s.clip];
    if (!action) continue;
    const duration = action.getClip().duration;
    action.weight = s.weight;
    action.time = s.loop ? s.time % duration : Math.min(s.time, duration);
    lift += s.weight * (CLIP_LIFT[s.clip as keyof typeof CLIP_LIFT] ?? 0);
  }
  athlete.mixer.update(0);
  athlete.body.position.y = lift;
}

/** The body's rest pose, read from the loaded (never animated) model: what `poseClip` turns key poses from. */
export function restPose(model: Object3D): { bones: Record<BoneKey, Quaternion>; hips: HipsRest } {
  model.updateMatrixWorld(true);
  const bones = {} as Record<BoneKey, Quaternion>;
  for (const key of Object.keys(BONES) as BoneKey[]) {
    bones[key] = model.getObjectByName(BONES[key])!.quaternion.clone();
  }
  const hips = model.getObjectByName(BONES.hips)!;
  return {
    bones,
    hips: {
      bone: BONES.hips,
      position: hips.position.clone(),
      parent: hips.parent!.getWorldQuaternion(new Quaternion()),
    },
  };
}
