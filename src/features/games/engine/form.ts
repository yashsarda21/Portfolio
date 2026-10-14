import type { Quality } from "./types";

/** How close a game came (F4): the share of its inputs played perfectly, 0 to 1. Saved with the result. */
export function perfectShare(inputs: readonly { q: Quality }[]): number {
  return inputs.length === 0 ? 0 : inputs.filter((i) => i.q === "perfect").length / inputs.length;
}
