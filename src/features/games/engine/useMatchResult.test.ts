import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ui } from "@/content";
import { useMatchRecord } from "@/shell/matchRecord";
import { resetLosses } from "./session";
import { useMatchResult } from "./useMatchResult";

beforeEach(() => {
  useMatchRecord.getState().reset();
  resetLosses();
});

const setup = (venue: "cricket" | "tennis" | "badminton" = "cricket") =>
  renderHook(() => useMatchResult(venue)).result.current;

describe("useMatchResult", () => {
  it("saves a Yash win to the record and offers the highlight on the second loss, not the first", () => {
    const { save } = setup();
    expect(save({ score: "14* NOT OUT", winner: "yash" })).toEqual({ offerHighlight: false });
    expect(save({ score: "0 OUT", winner: "yash" })).toEqual({ offerHighlight: true });
    const s = useMatchRecord.getState();
    expect(s.record).toEqual({ yash: 2, you: 0 });
    expect(s.venuesPlayed).toEqual(["cricket"]);
    expect(s.lastScores.cricket).toBe("0 OUT");
  });

  it("counts losses per venue", () => {
    setup("cricket").save({ score: "a", winner: "yash" });
    expect(setup("tennis").save({ score: "b", winner: "yash" })).toEqual({ offerHighlight: false });
  });

  it("a visitor win unlocks the Locker Room, the achievement and the Team Up prefill, and offers nothing", () => {
    const result = setup().save({ score: "BOWLED HIM", winner: "you" });
    const s = useMatchRecord.getState();
    expect(result).toEqual({ offerHighlight: false });
    expect(s.record).toEqual({ yash: 0, you: 1 });
    expect(s.lockerRoomUnlocked).toBe(true);
    expect(s.achievements).toEqual(["giant-killer"]);
    expect(s.teamUpPrefill).toBe(ui.games.prefill);
    expect(s.teamUpPrefill).toBe("I beat you.");
  });

  it("still returns, and the store holds the result, when storage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const { save } = setup();
    expect(save({ score: "14* NOT OUT", winner: "yash" })).toEqual({ offerHighlight: false });
    expect(useMatchRecord.getState().record.yash).toBe(1);
  });

  it("never throws out of save, even if the record itself fails", () => {
    const original = useMatchRecord.getState().completeMatch;
    useMatchRecord.setState({
      completeMatch: () => {
        throw new Error("boom");
      },
    });
    try {
      const { save } = setup();
      expect(() => save({ score: "x", winner: "yash" })).not.toThrow();
    } finally {
      useMatchRecord.setState({ completeMatch: original });
    }
  });
});
