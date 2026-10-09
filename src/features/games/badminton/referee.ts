import { pingPong } from "../engine/clock";
import { luckyWin } from "../engine/luck";
import type { Luck, Quality, Winner } from "../engine/types";

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
export type BadmintonCall = Shot | "perfect" | "through";
export interface BadmintonRally {
  shot: Shot;
  q: Quality;
  call: BadmintonCall;
}
export interface BadmintonState {
  rallies: BadmintonRally[];
  won: boolean;
}
export const BADMINTON_START_STATE: BadmintonState = { rallies: [], won: false };

export const powerAt = (elapsedMs: number) =>
  POWER.from + (POWER.to - POWER.from) * pingPong(elapsedMs, POWER.periodMs);
export const shotFor = (power: number): Shot =>
  power >= SMASH_FROM ? "smash" : power >= DROP_BELOW ? "clear" : "drop";
export const weightQuality = (power: number): Quality =>
  power >= PERFECT_WEIGHT.from && power <= PERFECT_WEIGHT.to ? "perfect" : "good";
export const badmintonOver = (s: BadmintonState) => s.rallies.length >= BADMINTON_RALLIES;
export const badmintonWinner = (s: BadmintonState): Winner | null =>
  badmintonOver(s) ? (s.won ? "you" : "yash") : null;
export const matchPoint = (s: BadmintonState) => s.rallies.length === BADMINTON_RALLIES - 1;
export function badmintonScore(s: BadmintonState): { yash: number; you: number } {
  const yashPoints =
    Math.min(s.rallies.length, BADMINTON_RALLIES - 1) + (badmintonOver(s) && !s.won ? 1 : 0);
  return { yash: BADMINTON_START.yash + yashPoints, you: BADMINTON_START.you + (s.won ? 1 : 0) };
}

/** One rally. Yash wins rallies 1–3 whatever you play; at 20–19 only a perfect drop after a perfect run, plus the 1 %, gets through. */
export function playRally(s: BadmintonState, power: number, luck: Luck): BadmintonState {
  if (badmintonOver(s)) return s;
  const shot = shotFor(power);
  const q = weightQuality(power);
  const call: BadmintonCall = q === "perfect" ? "perfect" : shot;
  if (!matchPoint(s)) return { rallies: [...s.rallies, { shot, q, call }], won: false };
  const won = luckyWin(q === "perfect" && s.rallies.every((r) => r.q === "perfect"), luck);
  return { rallies: [...s.rallies, { shot, q, call: won ? "through" : shot }], won };
}
