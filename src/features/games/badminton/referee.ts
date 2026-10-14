import { pingPong } from "../engine/clock";
import type { Quality } from "../engine/types";

export const BADMINTON_RALLIES = 4;
/** Meter fill in % of its height, bottom up: 8 → 86 over 1.4 s, bouncing while held (spec §8.3). */
export const POWER = { from: 8, to: 86, periodMs: 1400 } as const;
/** As drawn: SMASH is the top 20 %, CLEAR 20–60 % from the top, DROP the bottom 40 %. */
export const SMASH_FROM = 80;
export const DROP_BELOW = 40;
/** G6: the "perfect weight" band (6 % tall, inside DROP). Not drawn. */
export const PERFECT_WEIGHT = { from: 20, to: 26 } as const;
export const BADMINTON_START = { yash: 17, you: 19 } as const;
/** The shuttle's flight, then how long the call holds before the next rally. */
export const BADMINTON_BEATS = { flightMs: 600, callMs: 1200 } as const;
/** G10: clear, smash, drop, drop (none perfect): 21–19. */
export const BADMINTON_AUTO = [50, 85, 30, 30] as const;

export type Shot = "smash" | "clear" | "drop";
export type BadmintonCall = Shot | "perfect";
export interface BadmintonRally {
  shot: Shot;
  q: Quality;
  call: BadmintonCall;
}
export interface BadmintonState {
  rallies: BadmintonRally[];
}
export const BADMINTON_START_STATE: BadmintonState = { rallies: [] };

export const powerAt = (elapsedMs: number) =>
  POWER.from + (POWER.to - POWER.from) * pingPong(elapsedMs, POWER.periodMs);
export const shotFor = (power: number): Shot =>
  power >= SMASH_FROM ? "smash" : power >= DROP_BELOW ? "clear" : "drop";
export const weightQuality = (power: number): Quality =>
  power >= PERFECT_WEIGHT.from && power <= PERFECT_WEIGHT.to ? "perfect" : "good";
export const badmintonOver = (s: BadmintonState) => s.rallies.length >= BADMINTON_RALLIES;
export const matchPoint = (s: BadmintonState) => s.rallies.length === BADMINTON_RALLIES - 1;
/** Yash takes every rally, the last one too: 17–19 becomes 21–19 (F1). */
export function badmintonScore(s: BadmintonState): { yash: number; you: number } {
  return {
    yash: BADMINTON_START.yash + Math.min(s.rallies.length, BADMINTON_RALLIES),
    you: BADMINTON_START.you,
  };
}

/** One rally. Yash always wins (F1): every rally is his, and at match point the call is the shot, however perfect the run. */
export function playRally(s: BadmintonState, power: number): BadmintonState {
  if (badmintonOver(s)) return s;
  const shot = shotFor(power);
  const q = weightQuality(power);
  const call: BadmintonCall = q === "perfect" && !matchPoint(s) ? "perfect" : shot;
  return { rallies: [...s.rallies, { shot, q, call }] };
}
