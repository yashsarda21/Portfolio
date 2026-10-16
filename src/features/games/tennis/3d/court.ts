import type { Side } from "../referee";
import type { Vec3 } from "../../three/track";

export type { Vec3 };
export type ActorId = "yash" | "you";
export const ACTORS: readonly ActorId[] = ["yash", "you"];
export interface CameraPose {
  position: Vec3;
  target: Vec3;
}

/**
 * ITF sizes (m), each to the outside of its line. y is up; z runs from Yash's baseline (−) through the net (0) to yours
 * (+); x is your right as the camera sees it (the camera is behind you, looking down the court).
 */
export const COURT = {
  half: 11.885,
  singles: 4.115,
  doubles: 5.485,
  service: 6.4,
  line: 0.05,
  net: { centre: 0.914, post: 1.07, postX: 6.4 },
  /** From the baseline to the back fence, and from the doubles line to the side fence. */
  runoff: { back: 6.4, side: 3.66 },
} as const;
export const GRAVITY = 9.81;
export const BALL_RADIUS = 0.033;
/** Headings (radians, 0 faces +z): Yash faces you, you face him. */
export const FACE: Record<ActorId, number> = { yash: 0, you: Math.PI };
/** +1 for your right, −1 for your left. */
export const sideSign = (side: Side) => (side === "right" ? 1 : -1);
/** The tape's height at `x` (m): 0.914 in the middle, rising to 1.07 at the posts. */
export const netHeightAt = (x: number) =>
  COURT.net.centre +
  (COURT.net.post - COURT.net.centre) * Math.min(1, Math.abs(x) / COURT.net.postX);

/** Where Yash stands to serve: right of the centre mark (his right is −x) on the deuce court, left on the ad court. */
export const SERVE_SPOT = {
  deuce: [-0.9, 0, -12.2],
  ad: [0.9, 0, -12.2],
} as const satisfies Record<string, Vec3>;
/** Where you wait for the serve: the deuce box is on your right. */
export const RECEIVE_SPOT = {
  deuce: [2.4, 0, 13.4],
  ad: [-2.4, 0, 13.4],
} as const satisfies Record<string, Vec3>;
/** The service box each serve must land in (x and z ranges, to the outside of the lines). */
export const BOX = {
  deuce: { x: [0, COURT.singles], z: [0, COURT.service] },
  ad: { x: [-COURT.singles, 0], z: [0, COURT.service] },
} as const;
/** Where each player recovers to between shots: this deep, this far to the side he covers. */
export const YASH_BASE = { z: -12.6, cover: 1.5 } as const;
export const YOUR_BASE = { z: 13.2, cover: 0.6 } as const;

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

/**
 * The broadcast view: high behind your baseline, down the court. The column frames the same view a little higher
 * (`tilt`, degrees down), clear of the thumb zone. `pan` is how much of the ball's recent x the target follows. `game`
 * is where the camera has pushed in to at GAME. Tuned by eye in Task 8.
 */
export const CAMERA = {
  tv: { position: [0, 7.6, 25.5], target: [0, 0.6, -3] } as CameraPose,
  fov: { stage: 30, column: 44 },
  tilt: { stage: 0, column: 4 },
  pan: 0.25,
  game: { position: [0, 4.2, 6], target: [0, 1.2, -12] } as CameraPose,
} as const;
