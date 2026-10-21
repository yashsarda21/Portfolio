import type { Vec3 } from "./track";

/** `v` held between `lo` and `hi`. */
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** The number `f` of the way from `a` to `b`. */
export const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
/** An ease from 0 to 1 over `f` in [0, 1] (smoothstep): slow at both ends. */
export const smooth = (f: number) => {
  const c = clamp(f, 0, 1);
  return c * c * (3 - 2 * c);
};
/** The distance along the ground (x and z, not height) between two points (m). */
export const ground = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[2] - b[2]);

/** A point in the body's frame (x its left, y up, z its front) from a player standing at `spot` facing `face`, in the world. */
export function toWorld(spot: Vec3, face: number, offset: Vec3): Vec3 {
  const c = Math.cos(face);
  const s = Math.sin(face);
  return [
    spot[0] + offset[0] * c + offset[2] * s,
    spot[1] + offset[1],
    spot[2] - offset[0] * s + offset[2] * c,
  ];
}
/** Where a player facing `face` must stand so that `offset` (his racket's sweet spot) is at `contact`. */
export function feetFor(contact: Vec3, face: number, offset: Vec3): Vec3 {
  const at = toWorld([0, 0, 0], face, offset);
  return [contact[0] - at[0], 0, contact[2] - at[2]];
}
