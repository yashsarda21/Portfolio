import type { GameLayout, Quality } from "../engine/types";

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
/** 3D: the call holds while everyone walks back to their places. */
export const CRICKET_3D_BEATS = { calledMs: 3000 } as const;
/** G10: the reduced-motion over (FOUR, SIX, FOUR = 14*). */
export const CRICKET_AUTO: Quality[] = ["good", "miss", "good"];

export type CricketAim = "off" | "middle" | "leg";
/** The 3D lines, off side first (← moves toward OFF, → toward LEG). */
export const LINES = ["off", "middle", "leg"] as const satisfies readonly CricketAim[];
export type CricketCall = "dot" | "four" | "six";
export type CricketLine = "dot" | "four" | "six" | "lastPerfect" | "lastGood" | "lastSix";
export interface CricketBall {
  q: Quality;
  call: CricketCall;
  runs: 0 | 4 | 6;
  forYou: boolean;
  line: CricketLine;
  /** 3D only: the line it was bowled on and whether it was released late. */
  aim?: CricketAim;
  full?: boolean;
}
export interface CricketState {
  balls: CricketBall[];
}
export const CRICKET_START: CricketState = { balls: [] };

export function lengthQuality(p: number, layout: GameLayout): Quality {
  const d = Math.abs(p - 0.5);
  const zone = CRICKET_ZONES[layout];
  return d < zone.perfect ? "perfect" : d < zone.good ? "good" : "miss";
}

export const cricketOver = (s: CricketState) => s.balls.length >= CRICKET_BALLS;
export const cricketRuns = (s: CricketState) => s.balls.reduce((sum, b) => sum + b.runs, 0);

/** One ball. Yash always wins (F1): balls 1–2 judge the length; ball 3 is always a FOUR or SIX, whatever came before. */
export function bowl(
  s: CricketState,
  q: Quality,
  how?: { aim: CricketAim; full: boolean },
): CricketState {
  if (cricketOver(s)) return s;
  const last = s.balls.length === CRICKET_BALLS - 1;
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
  return { balls: [...s.balls, { ...ball, ...how }] };
}
