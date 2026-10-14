import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MATCH_RECORD_KEY,
  matchdayComplete,
  sanitizeRecord,
  useMatchRecord,
  useRecordReady,
  VENUES,
} from "./matchRecord";

describe("match record", () => {
  beforeEach(() => useMatchRecord.getState().reset());

  it("counts every finished game as Yash's win and keeps each venue's best form", () => {
    const s = useMatchRecord.getState();
    s.completeMatch({ venue: "cricket", score: "14* NOT OUT", form: 1 / 3 });
    s.completeMatch({ venue: "cricket", score: "4* NOT OUT", form: 0 });
    const r = useMatchRecord.getState();
    expect(r.yashWins).toBe(2);
    expect(r.lastScores.cricket).toBe("4* NOT OUT");
    expect(r.bestForm.cricket).toBeCloseTo(1 / 3);
    expect(r.venuesPlayed).toEqual(["cricket"]);
  });

  it("does not duplicate venues or seen sections", () => {
    const { completeMatch, markSeen } = useMatchRecord.getState();
    completeMatch({ venue: "cricket", score: "6*", form: 0 });
    completeMatch({ venue: "cricket", score: "10*", form: 0 });
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
    bestForm: {},
    yashWins: 0,
  };
  it.each([undefined, null, 42, "x", [], { state: 1 }])("treats %p as a fresh visitor", (raw) => {
    expect(sanitizeRecord(raw)).toEqual(fresh);
  });
  it("keeps a valid record as is", () => {
    const ok = {
      ...fresh,
      venuesPlayed: ["cricket"],
      lastScores: { cricket: "14* NOT OUT" },
      bestForm: { cricket: 0.5 },
      sectionsSeen: ["career"],
      yashWins: 1,
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
    expect(sanitizeRecord({ ...fresh, yashWins: -3 }).yashWins).toBe(0);
    expect(sanitizeRecord({ ...fresh, yashWins: "2" }).yashWins).toBe(0);
    expect(sanitizeRecord({ ...fresh, yashWins: 2.7 }).yashWins).toBe(2);
  });
  it("keeps only string sections", () => {
    expect(sanitizeRecord({ ...fresh, sectionsSeen: ["career", 3] }).sectionsSeen).toEqual([
      "career",
    ]);
  });
  it("migrates a Phase 5 record: keeps venues, scores, sections and Yash's wins; drops the win path", () => {
    expect(
      sanitizeRecord({
        venuesPlayed: ["cricket", "tennis"],
        lastScores: { cricket: "0 OUT", tennis: "GAME YASH" },
        sectionsSeen: ["career", "lockerRoom"],
        record: { yash: 2, you: 1 },
        achievements: ["giant-killer"],
        lockerRoomUnlocked: true,
        teamUpPrefill: "I beat you.",
      }),
    ).toEqual({
      venuesPlayed: ["cricket", "tennis"],
      lastScores: { cricket: "0 OUT", tennis: "GAME YASH" },
      bestForm: {},
      sectionsSeen: ["career", "lockerRoom"],
      yashWins: 2,
    });
  });
  it("keeps only finite forms between 0 and 1, for real venues", () => {
    expect(
      sanitizeRecord({ bestForm: { cricket: 0.5, tennis: 7, badminton: "x", golf: 0.2 } }).bestForm,
    ).toEqual({ cricket: 0.5, tennis: 1 });
  });
  it("says when the matchday is complete", () => {
    expect(matchdayComplete({ venuesPlayed: ["cricket", "tennis"] })).toBe(false);
    expect(matchdayComplete({ venuesPlayed: ["badminton", "cricket", "tennis"] })).toBe(true);
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

describe("a malformed saved record", () => {
  afterEach(() => {
    localStorage.removeItem(MATCH_RECORD_KEY);
    useMatchRecord.getState().reset();
  });
  it("still finishes loading: a fresh visitor, ready, and the bad value is dropped", async () => {
    localStorage.setItem(MATCH_RECORD_KEY, "{not json");
    const { result } = renderHook(() => useRecordReady());
    await act(async () => {
      await useMatchRecord.persist.rehydrate();
    });
    expect(useMatchRecord.persist.hasHydrated()).toBe(true);
    expect(result.current).toBe(true);
    expect(useMatchRecord.getState().venuesPlayed).toEqual([]);
    expect(useMatchRecord.getState().yashWins).toBe(0);
    expect(localStorage.getItem(MATCH_RECORD_KEY)).toBeNull();
  });
});
