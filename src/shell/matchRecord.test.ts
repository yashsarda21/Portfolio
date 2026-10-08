import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sanitizeRecord, useMatchRecord, useRecordReady, VENUES } from "./matchRecord";

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

describe("sanitizeRecord", () => {
  const fresh = {
    venuesPlayed: [],
    lastScores: {},
    sectionsSeen: [],
    record: { yash: 0, you: 0 },
    achievements: [],
    lockerRoomUnlocked: false,
    teamUpPrefill: null,
  };
  it.each([undefined, null, 42, "x", [], { state: 1 }])("treats %p as a fresh visitor", (raw) => {
    expect(sanitizeRecord(raw)).toEqual(fresh);
  });
  it("keeps a valid record as is", () => {
    const ok = {
      ...fresh,
      venuesPlayed: ["cricket"],
      lastScores: { cricket: "14* NOT OUT" },
      sectionsSeen: ["career"],
      record: { yash: 1, you: 0 },
    };
    expect(sanitizeRecord(ok)).toEqual(ok);
  });
  it("drops unknown venues, duplicate venues and non-string scores", () => {
    const r = sanitizeRecord({
      ...fresh,
      venuesPlayed: ["cricket", "golf", "cricket"],
      lastScores: { cricket: 7, tennis: "6-4", golf: "x" },
    });
    expect(r.venuesPlayed).toEqual(["cricket"]);
    expect(r.lastScores).toEqual({ tennis: "6-4" });
  });
  it("floors the tally at whole non-negative numbers", () => {
    expect(sanitizeRecord({ ...fresh, record: { yash: -3, you: "2" } }).record).toEqual({
      yash: 0,
      you: 0,
    });
    expect(sanitizeRecord({ ...fresh, record: { yash: 2.7, you: 1 } }).record).toEqual({
      yash: 2,
      you: 1,
    });
  });
  it("keeps only string sections and achievements", () => {
    const r = sanitizeRecord({
      ...fresh,
      sectionsSeen: ["career", 3],
      achievements: [null, "giant-killer"],
    });
    expect(r.sectionsSeen).toEqual(["career"]);
    expect(r.achievements).toEqual(["giant-killer"]);
  });
  it("lists the venues in the Hub's order", () =>
    expect(VENUES).toEqual(["cricket", "tennis", "badminton"]));
});

describe("useRecordReady", () => {
  it("is false before the saved record loads and true after; re-renders on finish", async () => {
    const { result } = renderHook(() => useRecordReady());
    expect(result.current).toBe(false);
    await act(async () => {
      await useMatchRecord.persist.rehydrate();
    });
    expect(result.current).toBe(true);
  });
});
