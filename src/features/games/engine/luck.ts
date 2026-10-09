import type { Luck } from "./types";

export const LUCK_ODDS = 0.12;

/** The 1 %: only a perfect streak rolls, and the roll must land under 12 %. Luck is not consumed otherwise. */
export function luckyWin(perfectStreak: boolean, luck: Luck): boolean {
  return perfectStreak && luck() < LUCK_ODDS;
}

/** P(win) for a player who is perfect with probability `perfectRate` on each of `inputs` inputs. */
export function winChance(perfectRate: number, inputs: number): number {
  return perfectRate ** inputs * LUCK_ODDS;
}
