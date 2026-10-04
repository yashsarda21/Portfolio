import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMatchRecord } from "./matchRecord";

describe("match record", () => {
  beforeEach(() => useMatchRecord.getState().reset());

  it("records a played venue, its score and Yash's win", () => {
    useMatchRecord.getState().completeMatch({ venue: "cricket", score: "14*", winner: "yash" });
    const s = useMatchRecord.getState();
    expect(s.venuesPlayed).toEqual(["cricket"]);
    expect(s.lastScores.cricket).toBe("14*");
    expect(s.record).toEqual({ yash: 1, you: 0 });
    expect(s.lockerRoomUnlocked).toBe(false);
  });

  it("a visitor win unlocks the Giant Killer achievement, Locker Room and Team Up prefill", () => {
    useMatchRecord
      .getState()
      .completeMatch({ venue: "tennis", score: "BOWLED", winner: "you", prefill: "I beat you." });
    const s = useMatchRecord.getState();
    expect(s.record).toEqual({ yash: 0, you: 1 });
    expect(s.achievements).toContain("giant-killer");
    expect(s.lockerRoomUnlocked).toBe(true);
    expect(s.teamUpPrefill).toBe("I beat you.");
  });

  it("does not duplicate venues or seen sections", () => {
    const { completeMatch, markSeen } = useMatchRecord.getState();
    completeMatch({ venue: "cricket", score: "6*", winner: "yash" });
    completeMatch({ venue: "cricket", score: "10*", winner: "yash" });
    markSeen("career");
    markSeen("career");
    const s = useMatchRecord.getState();
    expect(s.venuesPlayed).toEqual(["cricket"]);
    expect(s.lastScores.cricket).toBe("10*");
    expect(s.sectionsSeen).toEqual(["career"]);
  });

  it("keeps working when storage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => useMatchRecord.getState().markSeen("scout")).not.toThrow();
    expect(useMatchRecord.getState().sectionsSeen).toContain("scout");
    vi.restoreAllMocks();
  });
});
