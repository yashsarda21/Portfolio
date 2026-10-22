import type { CameraPose, Vec3 } from "../../three/track";
import type { Dir, Player } from "./match";

export type { CameraPose, Vec3 };

/**
 * BWF sizes (m), each to the outside of its line. y is up; z runs from Yash's back line (−) through the net (0) to
 * yours (+); x is your right as the camera sees it (the camera is behind you, looking down the court).
 */
export const COURT = {
  /** Half the length: the net to either back line. */
  half: 6.7,
  singles: 2.59,
  doubles: 3.05,
  /** The short service line, from the net. */
  shortService: 1.98,
  /** The doubles long service line, inside the back line. */
  longDoubles: 0.76,
  line: 0.04,
  net: { centre: 1.524, post: 1.55, postX: 3.05 },
  /** From the back line to the hall's boards, and from the doubles line to the side boards. */
  runoff: { back: 2.0, side: 1.5 },
} as const;
export const GRAVITY = 9.81;
/** Headings (radians, 0 faces +z): Yash faces you, you face him. */
export const FACE: Record<Player, number> = { yash: 0, you: Math.PI };
/** The tape's height at `x` (m): 1.524 in the middle, rising to 1.55 at the posts. */
export const netHeightAt = (x: number) =>
  COURT.net.centre +
  (COURT.net.post - COURT.net.centre) * Math.min(1, Math.abs(x) / COURT.net.postX);
/**
 * The sign of a player's box on the x axis (+1 or −1). Players face each other, so Yash's right is −x and his left is
 * +x; your right is +x and your left is −x.
 */
export const boxX = (player: Player, box: "right" | "left"): number =>
  (player === "you" ? 1 : -1) * (box === "right" ? 1 : -1);

// Places below are starting values, tuned by eye in Task 9.
/** How deep (z, to Yash's side as a positive distance from the net) he serves from, and where you wait to receive. */
export const SERVE_SPOT_Z = 3.0;
export const RECEIVE_Z = 3.5;
/** How far off the centre line a player stands in his box. */
export const BOX_X = 0.55;
/** Where Yash recovers to between shots (distance from the net, m). */
export const BASE_Z = 3.6;
/** Where Yash stands when that part is open: forward leaves the back open (distance from the net, m). */
export const SET_Z: Record<Dir, number> = { deep: 2.6, short: 4.6 };
/** How far from the net the racket meets the shuttle: [near, far] for an overhead stroke and for a mid-height one. */
export const CONTACT_Z = { overhead: [4.6, 5.6], mid: [3.0, 4.0] } as const;

/**
 * The broadcast view: high behind your back line, down the court. The column frames the same view a little higher
 * (`tilt`, degrees down), clear of the thumb zone. `pan` is how much of the shuttle's recent x the target follows.
 * `game` is where the camera has pushed in to at GAME. Tuned by eye in Task 9.
 */
export const CAMERA = {
  tv: { position: [0, 11, 21], target: [0, 0.8, 1] } as CameraPose,
  fov: { stage: 25, column: 42 },
  tilt: { stage: 0, column: 6 },
  pan: 0.2,
  game: { position: [0, 3.2, 4.5], target: [0, 1.2, -6] } as CameraPose,
} as const;
