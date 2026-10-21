import type { Side } from "../referee";
import type { CameraPose, Vec3 } from "../../three/track";

export { feetFor, toWorld } from "../../three/geometry";
export type { CameraPose, Vec3 };
export type ActorId = "yash" | "you";
export const ACTORS: readonly ActorId[] = ["yash", "you"];

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
/**
 * Where you wait for the serve: the deuce box is on your right. Deep and wide enough that the return is a short step,
 * not a dash: your feet at the return's contact are 14.3–15.1 m deep (by the serve's speed), and their x runs from 1.9
 * to 3.7 on the deuce court (from -3.9 to -2.1 on the ad court, the backhand side) once the nearer stroke is picked, so
 * you wait in the middle of both (at most about 1 m from any return).
 */
export const RECEIVE_SPOT = {
  deuce: [2.8, 0, 14.7],
  ad: [-3.0, 0, 14.7],
} as const satisfies Record<string, Vec3>;
/** The service box each serve must land in (x and z ranges, to the outside of the lines). */
export const BOX = {
  deuce: { x: [0, COURT.singles], z: [0, COURT.service] },
  ad: { x: [-COURT.singles, 0], z: [0, COURT.service] },
} as const;
/** Where each player recovers to between shots: this deep, this far to the side he covers. */
export const YASH_BASE = { z: -12.6, cover: 1.5 } as const;
export const YOUR_BASE = { z: 13.2, cover: 0.6 } as const;

/**
 * The broadcast view: high behind your baseline, down the court. The column frames the same view a little higher
 * (`tilt`, degrees down), clear of the thumb zone. `pan` is how much of the ball's recent x the target follows. `game`
 * is where the camera has pushed in to at GAME. Tuned by eye in Task 8.
 */
export const CAMERA = {
  tv: { position: [0, 11, 32], target: [0, 1.83, 3.4] } as CameraPose,
  fov: { stage: 30, column: 44 },
  tilt: { stage: 0, column: 4 },
  pan: 0.25,
  game: { position: [0, 4.2, 6], target: [0, 1.2, -12] } as CameraPose,
} as const;
