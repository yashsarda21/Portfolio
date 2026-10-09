import { luckyWin } from "../engine/luck";
import type { GameLayout, Luck, Quality, Winner } from "../engine/types";

export const CRICKET_BALLS = 3;
/** The cursor crosses the meter once every 1.1 s (the prototype). */
export const CRICKET_PERIOD_MS = 1100;
/** Distance from the meter's centre (track 0–1) that still counts, as drawn: the stage, and the wider touch column. */
export const CRICKET_ZONES: Record<GameLayout, { perfect: number; good: number }> = {
  stage: { perfect: 0.035, good: 0.12 },
  column: { perfect: 0.05, good: 0.14 },
};
/** The ball's flight to the batter, then how long the call holds before the next ball. */
export const CRICKET_BEATS = { flightMs: 450, callMs: 1200 } as const;
/** G10: the reduced-motion over (FOUR, SIX, FOUR = 14*). */
export const CRICKET_AUTO: Quality[] = ["good", "miss", "good"];

export type CricketCall = "dot" | "four" | "six" | "bowled";
export type CricketLine =
  "dot" | "four" | "six" | "lastPerfect" | "lastGood" | "lastSix" | "bowled";
export interface CricketBall {
  q: Quality;
  call: CricketCall;
  runs: 0 | 4 | 6;
  forYou: boolean;
  line: CricketLine;
}
export interface CricketState {
  balls: CricketBall[];
  won: boolean;
}
export const CRICKET_START: CricketState = { balls: [], won: false };

export function lengthQuality(p: number, layout: GameLayout): Quality {
  const d = Math.abs(p - 0.5);
  const zone = CRICKET_ZONES[layout];
  return d < zone.perfect ? "perfect" : d < zone.good ? "good" : "miss";
}

export const cricketOver = (s: CricketState) => s.balls.length >= CRICKET_BALLS;
export const cricketRuns = (s: CricketState) => s.balls.reduce((sum, b) => sum + b.runs, 0);
export const cricketWinner = (s: CricketState): Winner | null =>
  cricketOver(s) ? (s.won ? "you" : "yash") : null;

/** One ball (audit §6.1, verbatim rules). Balls 1–2 judge the length; ball 3 is a FOUR or SIX unless the 1 % lands. */
export function bowl(s: CricketState, q: Quality, luck: Luck): CricketState {
  if (cricketOver(s)) return s;
  const last = s.balls.length === CRICKET_BALLS - 1;
  if (last && luckyWin(q === "perfect" && s.balls.every((b) => b.q === "perfect"), luck)) {
    return {
      balls: [...s.balls, { q, call: "bowled", runs: 0, forYou: true, line: "bowled" }],
      won: true,
    };
  }
  const ball: CricketBall =
    q === "miss"
      ? { q, call: "six", runs: 6, forYou: false, line: last ? "lastSix" : "six" }
      : q === "good" || last
        ? {
            q,
            call: "four",
            runs: 4,
            forYou: false,
            line: last ? (q === "perfect" ? "lastPerfect" : "lastGood") : "four",
          }
        : { q, call: "dot", runs: 0, forYou: true, line: "dot" };
  return { balls: [...s.balls, ball], won: false };
}
