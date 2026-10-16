import type { Quality } from "../../engine/types";
import type { CricketAim } from "../referee";
import { LINE_X } from "./field";

/** Speed-gun bands (km/h) by timing quality (spec §4.2). */
export const SPEED_KMH: Record<Quality, readonly [number, number]> = {
  perfect: [142, 145],
  good: [132, 138],
  miss: [120, 128],
};
/** How far (m) a ball may stray sideways from the chosen line. */
export const SCATTER_M: Record<Quality, number> = { perfect: 0, good: 0.08, miss: 0.2 };
/** Where balls pitch (z, m): the yorker at the meter's centre, the shortest at its left end, never fuller than `fullest`. */
export const LENGTH_Z = { yorker: 2.0, short: 11.0, fullest: 1.7 } as const;
/** The largest sideways nudge (m) off the seam by the time the ball reaches the bat; a perfect ball is right on the spot. */
export const SEAM_M: Record<Quality, number> = { perfect: 0, good: 0.1, miss: 0.1 };

export interface Delivery {
  speedKmh: number;
  /** Where it pitches; null for a full toss (a late miss). */
  pitchZ: number | null;
  /** Its line at the bat before the seam (m; negative is the off side). */
  x: number;
  seam: number;
  line: CricketAim;
}

/** A ball from your release: `p` is the meter's place (0 to 1, centre 0.5), `quality` the referee's judgement of it. */
export function planDelivery(
  { quality, p, line }: { quality: Quality; p: number; line: CricketAim },
  rand: () => number = Math.random,
): Delivery {
  const [lo, hi] = SPEED_KMH[quality];
  const speedKmh = Math.round(lo + rand() * (hi - lo));
  const late = p > 0.5;
  const pitchZ =
    quality === "miss" && late
      ? null
      : late
        ? Math.max(LENGTH_Z.fullest, LENGTH_Z.yorker - (p - 0.5) * 2)
        : LENGTH_Z.yorker + ((0.5 - p) / 0.5) * (LENGTH_Z.short - LENGTH_Z.yorker);
  const x = LINE_X[line] + (rand() * 2 - 1) * SCATTER_M[quality];
  const seam = pitchZ === null ? 0 : (rand() * 2 - 1) * SEAM_M[quality];
  return { speedKmh, pitchZ, x, seam, line };
}
