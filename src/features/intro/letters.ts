import { seeded } from "@/lib/seeded";

/** The three ways a letter locks in: la drops from above, lb rises from below, lc zooms in. */
export type LetterKind = "la" | "lb" | "lc";

export interface LetterPlan {
  kind: LetterKind;
  /** Its turn to lock in (0 is first). */
  order: number;
}

export interface IntroLetter extends LetterPlan {
  ch: string;
}

const KINDS: readonly LetterKind[] = ["la", "lb", "lc"];

/** The board's order for the ten letters of YASH SARDA. */
const BOARD_ORDER = [3, 0, 7, 5, 1, 9, 2, 8, 6, 4];

/** A Fisher-Yates shuffle of 0..n-1 with the artboard's generator (seed 7). */
function permutation(n: number): number[] {
  const rnd = seeded(7);
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

/** How `count` letters lock in: kinds go round la, lb, lc; ten letters use the board's order, others a seeded one. */
export function planLetters(count: number): LetterPlan[] {
  const order = count === BOARD_ORDER.length ? BOARD_ORDER : permutation(count);
  return order.map((turn, i) => ({ kind: KINDS[i % KINDS.length]!, order: turn }));
}

/** One entry per character of the name (spaces count as letters, as on the board). */
export function createLetters(name: string): IntroLetter[] {
  const chars = name.split("");
  return planLetters(chars.length).map((plan, i) => ({ ch: chars[i]!, ...plan }));
}
