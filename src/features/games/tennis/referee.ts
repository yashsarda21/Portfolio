import { luckyWin } from "../engine/luck";
import type { GameLayout, Luck, Quality, Winner } from "../engine/types";

export type Side = "left" | "right";
export const TENNIS_SERVES = 3;
export const SERVE_WINDOW_MS = [900, 700, 500] as const;
/** The column (touch) gets 25 % longer (spec §8.2). */
export const TOUCH_STRETCH = 1.25;
export const PERFECT_SHARE = 0.4;
export const SERVE_KMH = [178, 186, 194] as const;
/** The open side lights up this long after the serve begins; the toss then runs a random 0.4–0.9 s. */
export const TELL_MS = 300;
export const TOSS_MS = { min: 400, max: 900 } as const;
/**
 * The returned ball's flight, then how long the call holds before the next serve. `firstMs` is the beat a visitor
 * gets on arriving, once the page has settled, to read the board before the first serve begins.
 */
export const TENNIS_BEATS = { flightMs: 500, callMs: 1400, firstMs: 1500 } as const;
/** G5: the bug narrates Yash's service game, YASH first: the points before each serve. */
export const TENNIS_POINTS = [
  ["15", "15"],
  ["30", "15"],
  ["40", "30"],
] as const;
/** G10: each auto return lands on the open side at 60 % of the window (good). */
export const TENNIS_AUTO_SHARE = 0.6;

export type TennisCall = "clean" | "returned" | "ace" | "wrong" | "early" | "line" | "winner";
export interface TennisServe {
  open: Side;
  tossMs: number;
}
export interface TennisReturn {
  q: Quality;
  call: TennisCall;
}
export interface TennisState {
  serve: TennisServe | null;
  returns: TennisReturn[];
  won: boolean;
}
/** When the visitor picked, in ms after Yash's hit (negative: before it); `side: null` when the window ran out. */
export interface ReturnPick {
  side: Side | null;
  atMs: number;
}
export const TENNIS_START: TennisState = { serve: null, returns: [], won: false };

export const windowFor = (serve: number, layout: GameLayout) =>
  SERVE_WINDOW_MS[serve]! * (layout === "column" ? TOUCH_STRETCH : 1);
export const tennisOver = (s: TennisState) => s.returns.length >= TENNIS_SERVES;
export const tennisWinner = (s: TennisState): Winner | null =>
  tennisOver(s) ? (s.won ? "you" : "yash") : null;
export const tennisPoints = (s: TennisState) =>
  TENNIS_POINTS[Math.min(s.returns.length, TENNIS_SERVES - 1)]!;

/** The next serve: the open side and the toss are drawn from `luck` (the same source as the 1 % roll). */
export function newServe(s: TennisState, luck: Luck): TennisState {
  if (tennisOver(s)) return s;
  const open: Side = luck() < 0.5 ? "left" : "right";
  return { ...s, serve: { open, tossMs: TOSS_MS.min + luck() * (TOSS_MS.max - TOSS_MS.min) } };
}

export function returnQuality(pick: ReturnPick, open: Side, windowMs: number): TennisReturn {
  if (pick.side === null || pick.atMs > windowMs) return { q: "miss", call: "ace" };
  if (pick.atMs < 0) return { q: "miss", call: "early" };
  if (pick.side !== open) return { q: "miss", call: "wrong" };
  return pick.atMs <= windowMs * PERFECT_SHARE
    ? { q: "perfect", call: "clean" }
    : { q: "good", call: "returned" };
}

/** One return. Serve 3: Yash's winner clips the line unless the streak is perfect and the 1 % lands (spec §8.2). */
export function playReturn(
  s: TennisState,
  pick: ReturnPick,
  layout: GameLayout,
  luck: Luck,
): TennisState {
  if (!s.serve || tennisOver(s)) return s;
  const i = s.returns.length;
  const r = returnQuality(pick, s.serve.open, windowFor(i, layout));
  if (i < TENNIS_SERVES - 1) return { serve: null, returns: [...s.returns, r], won: false };
  const won = luckyWin(r.q === "perfect" && s.returns.every((x) => x.q === "perfect"), luck);
  return { serve: null, returns: [...s.returns, { q: r.q, call: won ? "winner" : "line" }], won };
}
