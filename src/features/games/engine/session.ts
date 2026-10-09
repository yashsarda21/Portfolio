import type { Venue } from "@/shell/matchRecord";

/** G9: losses at each venue in this visit (until the page reloads), for the "watch the highlight" offer. */
export const OFFER_AFTER_LOSSES = 2;

const losses = new Map<Venue, number>();

export function noteLoss(venue: Venue): number {
  const n = (losses.get(venue) ?? 0) + 1;
  losses.set(venue, n);
  return n;
}

export function resetLosses(): void {
  losses.clear();
}
