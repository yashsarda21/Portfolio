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
  sectionsSeen: string[];
  record: { yash: number; you: number };
  achievements: string[];
  lockerRoomUnlocked: boolean;
  teamUpPrefill: string | null;
}

interface MatchRecordActions {
  completeMatch(m: { venue: Venue; score: string; winner: "yash" | "you"; prefill?: string }): void;
  markSeen(section: string): void;
  reset(): void;
}

const initial: MatchRecordData = {
  venuesPlayed: [],
  lastScores: {},
  sectionsSeen: [],
  record: { yash: 0, you: 0 },
  achievements: [],
  lockerRoomUnlocked: false,
  teamUpPrefill: null,
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
  const tally = (r.record && typeof r.record === "object" ? r.record : {}) as Record<
    string,
    unknown
  >;
  return {
    venuesPlayed: [...new Set(strings(r.venuesPlayed).filter(isVenue))],
    lastScores: Object.fromEntries(
      Object.entries(scores).filter(([k, v]) => isVenue(k) && typeof v === "string"),
    ) as MatchRecordData["lastScores"],
    sectionsSeen: [...new Set(strings(r.sectionsSeen))],
    record: { yash: count(tally.yash), you: count(tally.you) },
    achievements: [...new Set(strings(r.achievements))],
    lockerRoomUnlocked: r.lockerRoomUnlocked === true,
    teamUpPrefill: typeof r.teamUpPrefill === "string" ? r.teamUpPrefill : null,
  };
}

/** The visitor's saved progress (spec §4.6). Works without storage; just doesn't persist. */
export const useMatchRecord = create<MatchRecordData & MatchRecordActions>()(
  persist(
    (set) => ({
      ...initial,
      completeMatch: ({ venue, score, winner, prefill }) =>
        set((s) => {
          const won = winner === "you";
          return {
            venuesPlayed: s.venuesPlayed.includes(venue)
              ? s.venuesPlayed
              : [...s.venuesPlayed, venue],
            lastScores: { ...s.lastScores, [venue]: score },
            record: { yash: s.record.yash + (won ? 0 : 1), you: s.record.you + (won ? 1 : 0) },
            achievements:
              won && !s.achievements.includes("giant-killer")
                ? [...s.achievements, "giant-killer"]
                : s.achievements,
            lockerRoomUnlocked: s.lockerRoomUnlocked || won,
            teamUpPrefill: won && prefill ? prefill : s.teamUpPrefill,
          };
        }),
      markSeen: (section) =>
        set((s) =>
          s.sectionsSeen.includes(section) ? s : { sectionsSeen: [...s.sectionsSeen, section] },
        ),
      reset: () => set({ ...initial }),
    }),
    {
      name: MATCH_RECORD_KEY,
      version: 1,
      merge: (persisted, current) => ({ ...current, ...sanitizeRecord(persisted) }),
      // A future version bump lands here.
      migrate: (persisted) => sanitizeRecord(persisted),
      storage: createJSONStorage(() => safeJSONStorage),
      skipHydration: true,
    },
  ),
);

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
