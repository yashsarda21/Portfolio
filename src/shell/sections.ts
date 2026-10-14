import { useEffect } from "react";
import { useLocation } from "react-router";
import {
  matchdayComplete,
  useMatchRecord,
  useRecordReady,
  type MatchRecordData,
} from "./matchRecord";
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
  "fullTime",
] as const;
export type SectionKey = (typeof SECTIONS)[number];

export function sectionForPath(pathname: string): SectionKey | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return SECTIONS.find((key) => ROUTES[key] === path) ?? null;
}

/**
 * The section to mark seen for a page: Full Time counts only once the matchday is complete (opened early it reads
 * "NOT YET.", and the Hub's index must not call that SEEN).
 */
export function sectionToMark(
  pathname: string,
  record: Pick<MatchRecordData, "venuesPlayed">,
): SectionKey | null {
  const key = sectionForPath(pathname);
  if (key === "fullTime" && !matchdayComplete(record)) return null;
  return key;
}

/** Marks a section seen whenever its page opens, however the visitor got there. Mount once, in the shell. */
export function SeenTracker() {
  const { pathname } = useLocation();
  const markSeen = useMatchRecord((s) => s.markSeen);
  // Wait for the saved record: a mark made before it loads would be overwritten by it (lost on a direct load).
  const ready = useRecordReady();
  useEffect(() => {
    if (!ready) return;
    const key = sectionToMark(pathname, useMatchRecord.getState());
    if (key) markSeen(key);
  }, [pathname, markSeen, ready]);
  return null;
}
