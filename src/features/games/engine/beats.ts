/** The call holds this long before the end buttons (README loop: Verdict 2s). */
export const VERDICT_MS = 2000;
/** Reduced motion: the whole game is replaced by this (spec §8 fair play). */
export const AUTO_RALLY_MS = 3000;
/** README fair play: no game runs longer than 15 s with prompt play. */
export const MAX_GAME_MS = 15000;

/** When each auto-rally input resolves: evenly spaced inside the 3 s. */
export function autoRallyTimes(inputs: number, totalMs = AUTO_RALLY_MS): number[] {
  return Array.from({ length: inputs }, (_, i) => ((i + 1) * totalMs) / (inputs + 1));
}
