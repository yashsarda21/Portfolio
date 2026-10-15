import type { CricketAim } from "../referee";
import type { Vec3 } from "../../three/track";

export type { Vec3 };

/** Positions are metres and seconds. +z runs from Yash's stumps (z 0) to the bowler's (z 20.12); +x is the right of the TV picture, the leg side of a right-handed batter (Yash); y is up. */
export interface CameraPose {
  position: Vec3;
  target: Vec3;
}
export type ActorId = "yash" | "bowler" | "keeper" | "slip" | "cover" | "midwicket" | "fineLeg";

export const PITCH = { length: 20.12, width: 3.05, crease: 1.22 } as const;
export const GRAVITY = 9.81;
export const BALL_RADIUS = 0.036;
/** Where the ball leaves the bowler's hand (right arm, over the wicket). */
export const RELEASE: Vec3 = [0.35, 2.2, 18.9];
/** Where the bat meets the ball, along the pitch. */
export const CONTACT_Z = 1.6;
/** Where the keeper takes a ball that beats the bat. */
export const KEEPER_TAKE_Z = -12.4;
/** The boundary rope: a circle on the ground around the pitch's middle. */
export const ROPE = { centre: [0, 0, PITCH.length / 2] as Vec3, radius: 65 };
/** The bowler's mark, and where his run-up leaps. */
export const MARK: Vec3 = [0.6, 0, 31];
export const JUMP_Z = 20.2;
/** The line at the bat for each choice (m): just outside off stump, middle, on the pads. */
export const LINE_X: Record<CricketAim, number> = { off: -0.15, middle: 0, leg: 0.12 };

export const ACTORS: readonly ActorId[] = [
  "yash",
  "bowler",
  "keeper",
  "slip",
  "cover",
  "midwicket",
  "fineLeg",
];
/** The fielders who may chase a drive (the keeper never leaves his place). */
export const FIELDERS: readonly ActorId[] = ["slip", "cover", "midwicket", "fineLeg"];
export const HOME: Record<ActorId, Vec3> = {
  yash: [0.35, 0, 1.0],
  bowler: MARK,
  keeper: [-0.4, 0, -13],
  slip: [-2.4, 0, -13.5],
  cover: [-17, 0, 12],
  midwicket: [16, 0, 13],
  fineLeg: [14, 0, -24],
};
/** From ball 2 on, these two have walked in this far toward Yash (the rhythm, spec §3.3). */
export const WALK_IN = { who: ["cover", "midwicket"] as readonly ActorId[], metres: 4 };

/** Where an actor stands before ball `ball` (0 to 2). */
export function homeOf(id: ActorId, ball: number): Vec3 {
  const h = HOME[id];
  if (ball < 1 || !WALK_IN.who.includes(id)) return h;
  const [bx, , bz] = HOME.yash;
  const d = Math.hypot(bx - h[0], bz - h[2]);
  const f = WALK_IN.metres / d;
  return [h[0] + (bx - h[0]) * f, 0, h[2] + (bz - h[2]) * f];
}

/** The way an actor faces at rest (radians; 0 faces +z, the bowler's end; PI/2 faces +x). */
export function faceOf(id: ActorId): number {
  if (id === "yash") return -Math.PI / 2; // side-on, chest to the off side
  if (id === "bowler") return Math.PI;
  if (id === "keeper" || id === "slip") return 0;
  const [hx, , hz] = HOME[id];
  const [bx, , bz] = HOME.yash;
  return Math.atan2(bx - hx, bz - hz);
}

/** The TV view from behind the bowler (tuned in Task 6 against the stage and the column), and each layout's lens. */
export const CAMERA = {
  aim: { position: [0, 6.2, 42], target: [0, 0.9, 2] } as CameraPose,
  fov: { stage: 20, column: 34 },
};
