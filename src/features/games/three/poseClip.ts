import {
  AnimationClip,
  Euler,
  Quaternion,
  QuaternionKeyframeTrack,
  Vector3,
  VectorKeyframeTrack,
  type KeyframeTrack,
} from "three";
import type { Vec3 } from "./track";

export type Rotation = readonly [x: number, y: number, z: number];
export interface PoseKey<B extends string> {
  at: number;
  /** Degrees (XYZ) each bone turns from its rest rotation; a bone left out is at rest. */
  pose: Partial<Record<B, Rotation>>;
  /** Metres the hips move from their rest place, in the body's frame (x its left, y up, z its front); none is at rest. */
  hips?: Vec3;
}
/** Where the hips bone rests: its name, its rest position, and its parent's rest rotation in the body's frame. */
export interface HipsRest {
  bone: string;
  position: Vector3;
  parent: Quaternion;
}
const DEG = Math.PI / 180;

/**
 * A clip from key poses, for the moves the free pack lacks (spec B8). Every bone gets a track, so nothing from an
 * earlier clip is left behind. With `hips`, the clip also holds the hips' place (at rest unless a key moves them),
 * so a free clip's hip track never bleeds into it.
 */
export function poseClip<B extends string>(
  name: string,
  keys: readonly PoseKey<B>[],
  rest: Record<B, Quaternion>,
  bones: Record<B, string>,
  hips?: HipsRest,
): AnimationClip {
  const times = keys.map((k) => k.at);
  const tracks: KeyframeTrack[] = (Object.keys(bones) as B[]).map(
    (b) =>
      new QuaternionKeyframeTrack(
        `${bones[b]}.quaternion`,
        times,
        keys.flatMap((k) => {
          const [x, y, z] = k.pose[b] ?? [0, 0, 0];
          return rest[b]
            .clone()
            .multiply(new Quaternion().setFromEuler(new Euler(x * DEG, y * DEG, z * DEG)))
            .toArray();
        }),
      ),
  );
  if (hips) {
    const toParent = hips.parent.clone().invert();
    tracks.push(
      new VectorKeyframeTrack(
        `${hips.bone}.position`,
        times,
        keys.flatMap((k) =>
          new Vector3(...(k.hips ?? [0, 0, 0]))
            .applyQuaternion(toParent)
            .add(hips.position)
            .toArray(),
        ),
      ),
    );
  }
  return new AnimationClip(name, keys.at(-1)?.at ?? 0, tracks);
}
