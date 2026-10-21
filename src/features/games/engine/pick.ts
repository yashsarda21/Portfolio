import type { Quality } from "./types";

/** How a pick went, in the words a game's referee maps onto its own calls. */
export type PickCall = "late" | "early" | "wrong" | "good" | "perfect";
/** A pick's judgement: the quality for the scoreboard and the call. */
export interface Judged {
  q: Quality;
  call: PickCall;
}
/** A pick in the first 40 % of the window is perfect; later in the window it is good. */
export const PERFECT_SHARE = 0.4;

/**
 * Judges one pick against the choice that is lit. `atMs` is when the visitor picked, in ms after the hit (negative:
 * before it); `dir` is null when the window ran out with no pick. No pick, or one after the window, is late; one before
 * the hit is early; the other choice in time is wrong; the lit one is perfect in the first `PERFECT_SHARE` of the
 * window, then good.
 */
export function pickQuality<D extends string>(
  pick: { dir: D | null; atMs: number },
  open: D,
  windowMs: number,
): Judged {
  if (pick.dir === null || pick.atMs > windowMs) return { q: "miss", call: "late" };
  if (pick.atMs < 0) return { q: "miss", call: "early" };
  if (pick.dir !== open) return { q: "miss", call: "wrong" };
  return pick.atMs <= windowMs * PERFECT_SHARE
    ? { q: "perfect", call: "perfect" }
    : { q: "good", call: "good" };
}
