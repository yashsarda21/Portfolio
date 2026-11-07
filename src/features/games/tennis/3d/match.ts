import type { GameLayout } from "../../engine/types";
import {
  returnQuality,
  TOUCH_STRETCH,
  type ReturnPick,
  type Side,
  type TennisReturn,
} from "../referee";

/** T2: the most points you can win (you reach 30 at most). */
export const YOUR_CAP = 2;
/** Yash wins the game on his fourth point (15, 30, 40, GAME). */
export const GAME_AT = 4;
export const POINT_NAMES = ["0", "15", "30", "40"] as const;
/** §3.3: each window (ms), by Yash's points before the point (0, 15, 30, 40). */
export const WINDOW_MS = { serve: [1000, 900, 800, 700], rally: [1100, 1000, 900, 800] } as const;
export const SERVE_KMH_3D = [178, 184, 190, 196] as const;
/** The call holds this long before the next point's routine; the first point waits `firstMs` after the 3D shows. */
export const TENNIS_3D_BEATS = { callMs: 1800, firstMs: 1500 } as const;

/** Which of Yash's hits a window follows. */
export type Hit = keyof typeof WINDOW_MS;
/** How a point ended (§3.2). "out" (your best shot at 30) is drawn into the net since Phase 9 (owner 2026-11-07). */
export type PointCall = "ace" | "early" | "wrong" | "late" | "winner" | "out";
export type Court = "deuce" | "ad";
export interface Point {
  winner: "yash" | "you";
  call: PointCall;
  /** Shots played, the serve included: 1, 3 or 4 (T3). */
  shots: 1 | 3 | 4;
  /** Your inputs in this point (1 or 2), as judged. */
  inputs: TennisReturn[];
}
export interface MatchState {
  points: Point[];
}
export const MATCH_START: MatchState = { points: [] };

export const yashPoints = (s: MatchState) => s.points.filter((p) => p.winner === "yash").length;
export const yourPoints = (s: MatchState) => s.points.filter((p) => p.winner === "you").length;
export const matchOver = (s: MatchState) => yashPoints(s) >= GAME_AT;
const step = (s: MatchState) => Math.min(yashPoints(s), GAME_AT - 1);

/** The window for an input (ms): it shrinks as Yash's score rises; the column (touch) gets 25 % longer. */
export const windowMs = (hit: Hit, s: MatchState, layout: GameLayout) =>
  WINDOW_MS[hit][step(s)]! * (layout === "column" ? TOUCH_STRETCH : 1);
export const serveKmh = (s: MatchState) => SERVE_KMH_3D[step(s)]!;
/** One pick, judged exactly as the 2D game judges a return (right side, in time, the first 40 % perfect). */
export const judge = (pick: ReturnPick, open: Side, window: number): TennisReturn =>
  returnQuality(pick, open, window);

/** How the point ends, from your inputs: a miss ends it at once; two good shots win it, unless you already have 30. */
export function decidePoint(s: MatchState, inputs: readonly TennisReturn[]): Point {
  const [first, second] = inputs;
  if (!first) throw new Error("a point needs your return");
  const missed = (r: TennisReturn, n: 1 | 2): Point => {
    const call: PointCall =
      r.call === "ace" ? (n === 1 ? "ace" : "late") : r.call === "early" ? "early" : "wrong";
    const shots = n === 1 ? (call === "wrong" ? 3 : 1) : call === "wrong" ? 4 : 3;
    return { winner: "yash", call, shots, inputs: [...inputs] };
  };
  if (first.q === "miss") return missed(first, 1);
  if (!second) throw new Error("a good return needs your second shot");
  if (second.q === "miss") return missed(second, 2);
  return yourPoints(s) < YOUR_CAP
    ? { winner: "you", call: "winner", shots: 4, inputs: [...inputs] }
    : { winner: "yash", call: "out", shots: 4, inputs: [...inputs] };
}

export const playPoint = (s: MatchState, inputs: readonly TennisReturn[]): MatchState =>
  matchOver(s) ? s : { points: [...s.points, decidePoint(s, inputs)] };
/** YASH first, as the bug reads: "40", "30". Yash's GAME shows as 40 with the status GAME YASH. */
export const scoreOf = (s: MatchState): [string, string] => [
  POINT_NAMES[step(s)]!,
  POINT_NAMES[Math.min(yourPoints(s), POINT_NAMES.length - 1)]!,
];
/** How many projects are on the big screen: one per Yash point, three at most (T5). */
export const unlockedOf = (s: MatchState) => Math.min(yashPoints(s), 3);
export const allInputs = (s: MatchState) => s.points.flatMap((p) => p.inputs);
/** Even points from the deuce court (Yash's right), odd from the ad court. */
export const courtOf = (s: MatchState): Court => (s.points.length % 2 === 0 ? "deuce" : "ad");
