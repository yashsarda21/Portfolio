import { useEffect } from "react";
import { useLocation } from "react-router";
import { useMatchRecord, useRecordReady } from "./matchRecord";
import { ROUTES } from "./routes";

/** The pages the Hub's index tracks as SEEN (H6). Training Academy is part of the trophies page. */
export const SECTIONS = [
  "career",
  "highlights",
  "attributes",
  "trophies",
  "card",
  "teamUp",
  "scout",
  "lockerRoom",
] as const;
export type SectionKey = (typeof SECTIONS)[number];

export function sectionForPath(pathname: string): SectionKey | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return SECTIONS.find((key) => ROUTES[key] === path) ?? null;
}

/** Marks a section seen whenever its page opens, however the visitor got there. Mount once, in the shell. */
export function SeenTracker() {
  const { pathname } = useLocation();
  const markSeen = useMatchRecord((s) => s.markSeen);
  // Wait for the saved record: a mark made before it loads would be overwritten by it (lost on a direct load).
  const ready = useRecordReady();
  useEffect(() => {
    if (!ready) return;
    const key = sectionForPath(pathname);
    if (key) markSeen(key);
  }, [pathname, markSeen, ready]);
  return null;
}
