import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/storage";

export type Venue = "cricket" | "tennis" | "badminton";

interface MatchRecordData {
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
      name: "arena:v1",
      version: 1,
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
