import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/storage";
import { MATCH_RECORD_KEY } from "./storageKeys";

export const VENUES = ["cricket", "tennis", "badminton"] as const;
export type Venue = (typeof VENUES)[number];
export { MATCH_RECORD_KEY };

export interface MatchRecordData {
  venuesPlayed: Venue[];
  lastScores: Partial<Record<Venue, string>>;
  /** Each venue's best perfect share (F4), 0 to 1. */
  bestForm: Partial<Record<Venue, number>>;
  sectionsSeen: string[];
  /** Every finished game: the visitor never wins (F1). */
  yashWins: number;
}

interface MatchRecordActions {
  completeMatch(m: { venue: Venue; score: string; form: number }): void;
  markSeen(section: string): void;
  reset(): void;
}

const initial: MatchRecordData = {
  venuesPlayed: [],
  lastScores: {},
  bestForm: {},
  sectionsSeen: [],
  yashWins: 0,
};

const isVenue = (v: unknown): v is Venue => VENUES.includes(v as Venue);
const strings = (v: unknown) =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
const count = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;

/** Whatever storage held, as a record the site can trust: unreadable parts fall back to a fresh visitor's. */
export function sanitizeRecord(raw: unknown): MatchRecordData {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...initial };
  const r = raw as Record<string, unknown>;
  const scores = (r.lastScores && typeof r.lastScores === "object" ? r.lastScores : {}) as Record<
    string,
    unknown
  >;
  const forms = (r.bestForm && typeof r.bestForm === "object" ? r.bestForm : {}) as Record<
    string,
    unknown
  >;
  // A Phase 5 record kept the tally as `record.yash`; the visitor's side (`you`) is gone with the win.
  const oldTally = (r.record && typeof r.record === "object" ? r.record : undefined) as
    { yash?: unknown } | undefined;
  return {
    venuesPlayed: [...new Set(strings(r.venuesPlayed).filter(isVenue))],
    lastScores: Object.fromEntries(
      Object.entries(scores).filter(([k, v]) => isVenue(k) && typeof v === "string"),
    ) as MatchRecordData["lastScores"],
    bestForm: Object.fromEntries(
      Object.entries(forms)
        .filter(([k, v]) => isVenue(k) && typeof v === "number" && Number.isFinite(v))
        .map(([k, v]) => [k, Math.min(1, Math.max(0, v as number))]),
    ) as MatchRecordData["bestForm"],
    sectionsSeen: [...new Set(strings(r.sectionsSeen))],
    yashWins: count(r.yashWins ?? oldTally?.yash),
  };
}

/** The visitor's saved progress (spec §4.6). Works without storage; just doesn't persist. */
export const useMatchRecord = create<MatchRecordData & MatchRecordActions>()(
  persist(
    (set) => ({
      ...initial,
      completeMatch: ({ venue, score, form }) =>
        set((s) => ({
          venuesPlayed: s.venuesPlayed.includes(venue)
            ? s.venuesPlayed
            : [...s.venuesPlayed, venue],
          lastScores: { ...s.lastScores, [venue]: score },
          bestForm: { ...s.bestForm, [venue]: Math.max(s.bestForm[venue] ?? 0, form) },
          yashWins: s.yashWins + 1,
        })),
      markSeen: (section) =>
        set((s) =>
          s.sectionsSeen.includes(section) ? s : { sectionsSeen: [...s.sectionsSeen, section] },
        ),
      reset: () => set({ ...initial }),
    }),
    {
      name: MATCH_RECORD_KEY,
      version: 2,
      merge: (persisted, current) => ({ ...current, ...sanitizeRecord(persisted) }),
      // A future version bump lands here.
      migrate: (persisted) => sanitizeRecord(persisted),
      storage: createJSONStorage(() => safeJSONStorage),
      skipHydration: true,
    },
  ),
);

/** All three venues played: Full Time is open (F3, F6). */
export const matchdayComplete = (r: Pick<MatchRecordData, "venuesPlayed">) =>
  VENUES.every((v) => r.venuesPlayed.includes(v));

/** Mount once in the shell: loads the saved record after hydration (no SSR mismatch). */
export function MatchRecordHydrator() {
  useEffect(() => {
    void useMatchRecord.persist.rehydrate();
  }, []);
  return null;
}

/** True once the saved record has been read (or there is none to read). Record-bound UI waits for it (H5). */
export function useRecordReady(): boolean {
  return useSyncExternalStore(
    (cb) => useMatchRecord.persist.onFinishHydration(cb),
    () => useMatchRecord.persist.hasHydrated(),
    () => false,
  );
}
