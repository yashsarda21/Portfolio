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

/** In-betweens per second for a smoothed clip. */
export const SMOOTH_FPS = 30;

/**
 * A monotone cubic (Fritsch-Butland) through `ys` at `xs`, read at `x`: it passes through every key, never
 * overshoots one (a held key stays held), starts and ends at rest (the speed eases up from the first key and down into
 * the last), and is fastest between keys that move a long way in a short time (the bat meeting the ball).
 */
function monotone(xs: readonly number[], ys: readonly number[], x: number): number {
  const n = xs.length;
  if (n < 2 || x <= xs[0]!) return ys[0]!;
  if (x >= xs[n - 1]!) return ys[n - 1]!;
  let k = 0;
  while (x > xs[k + 1]!) k++;
  const h = (i: number) => xs[i + 1]! - xs[i]!;
  const d = (i: number) => (ys[i + 1]! - ys[i]!) / h(i);
  const slope = (i: number) => {
    if (i === 0 || i === n - 1) return 0;
    const a = d(i - 1);
    const b = d(i);
    if (a * b <= 0) return 0;
    const w1 = 2 * h(i) + h(i - 1);
    const w2 = h(i) + 2 * h(i - 1);
    return (w1 + w2) / (w1 / a + w2 / b);
  };
  const t = (x - xs[k]!) / h(k);
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * ys[k]! +
    (t3 - 2 * t2 + t) * h(k) * slope(k) +
    (-2 * t3 + 3 * t2) * ys[k + 1]! +
    (t3 - t2) * h(k) * slope(k + 1)
  );
}

/** The times a smoothed clip is keyed at: every key's own time, and `SMOOTH_FPS` in-betweens between them. */
function smoothTimes(times: readonly number[]): number[] {
  const out: number[] = [];
  for (let k = 0; k < times.length - 1; k++) {
    const a = times[k]!;
    const b = times[k + 1]!;
    const steps = Math.max(1, Math.ceil((b - a) * SMOOTH_FPS));
    for (let s = 0; s < steps; s++) out.push(a + ((b - a) * s) / steps);
  }
  out.push(times.at(-1)!);
  return out;
}

/** Values (`size` per key) read at `at` through the keys at `times`, each component on its own monotone curve. */
function resample(times: readonly number[], values: number[], size: number, at: readonly number[]) {
  const out: number[] = [];
  for (const x of at)
    for (let c = 0; c < size; c++)
      out.push(
        monotone(
          times,
          times.map((_, k) => values[k * size + c]!),
          x,
        ),
      );
  return out;
}

/**
 * A clip from key poses, for the moves the free pack lacks (spec B8). Every bone gets a track, so nothing from an
 * earlier clip is left behind. With `hips`, the clip also holds the hips' place (at rest unless a key moves them),
 * so a free clip's hip track never bleeds into it. With `smooth`, the keys are joined by eased curves instead of
 * straight turns from one to the next: the clip is keyed `SMOOTH_FPS` times a second, still exactly on every key.
 */
export function poseClip<B extends string>(
  name: string,
  keys: readonly PoseKey<B>[],
  rest: Record<B, Quaternion>,
  bones: Record<B, string>,
  hips?: HipsRest,
  { smooth = false }: { smooth?: boolean } = {},
): AnimationClip {
  const times = keys.map((k) => k.at);
  const at = smooth && keys.length > 1 ? smoothTimes(times) : times;
  const keyed = (values: number[], size: number) =>
    at === times ? values : resample(times, values, size, at);
  const tracks: KeyframeTrack[] = (Object.keys(bones) as B[]).map((b) => {
    const qs = keys.map((k) => {
      const [x, y, z] = k.pose[b] ?? [0, 0, 0];
      return rest[b]
        .clone()
        .multiply(new Quaternion().setFromEuler(new Euler(x * DEG, y * DEG, z * DEG)));
    });
    // Each key on the same side of the sphere as the last, so the curve takes the short way round.
    for (let k = 1; k < qs.length; k++)
      if (qs[k]!.dot(qs[k - 1]!) < 0) qs[k]!.set(-qs[k]!.x, -qs[k]!.y, -qs[k]!.z, -qs[k]!.w);
    const values = keyed(
      qs.flatMap((q) => q.toArray()),
      4,
    );
    // The curve runs through the components, not on the sphere: back to unit length.
    for (let i = 0; i < values.length; i += 4) {
      const q = new Quaternion(values[i], values[i + 1], values[i + 2], values[i + 3]).normalize();
      values.splice(i, 4, q.x, q.y, q.z, q.w);
    }
    return new QuaternionKeyframeTrack(`${bones[b]}.quaternion`, at, values);
  });
  if (hips) {
    const toParent = hips.parent.clone().invert();
    tracks.push(
      new VectorKeyframeTrack(
        `${hips.bone}.position`,
        at,
        keyed(
          keys.flatMap((k) =>
            new Vector3(...(k.hips ?? [0, 0, 0]))
              .applyQuaternion(toParent)
              .add(hips.position)
              .toArray(),
          ),
          3,
        ),
      ),
    );
  }
  return new AnimationClip(name, keys.at(-1)?.at ?? 0, tracks);
}
