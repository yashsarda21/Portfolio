/**
 * What the centre of a game shows after a point (owner, 2026-11-07): the work Yash's point unlocked, big, or the
 * visitor's "WELL PLAYED." words. `to` is the side its card sits on, where the panel goes when its time is up.
 */
export type GameSpotlight =
  | { kind: "unlock"; eyebrow: string; title: string; line: string; to: "left" | "right" }
  | { kind: "yours"; text: string };

/** An unlock holds this long (owner: 4-5 s) before it leaves for its card. */
export const SPOTLIGHT_MS = 4500;
/** The last part of the hold is the exit: shrink to 60% and move toward the card while fading out. */
export const SPOTLIGHT_EXIT_MS = 450;

/** How long a called point holds before the next one: SPOTLIGHT_MS for an unlock, else `callMs`. */
export function holdFor(s: GameSpotlight | null, callMs: number): number {
  return s?.kind === "unlock" ? SPOTLIGHT_MS : callMs;
}
