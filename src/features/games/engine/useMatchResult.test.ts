import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMatchRecord } from "@/shell/matchRecord";
import { resetLosses } from "./session";
import { useMatchResult, type EndFlags } from "./useMatchResult";

beforeEach(() => {
  useMatchRecord.getState().reset();
  resetLosses();
});

const setup = (venue: "cricket" | "tennis" | "badminton" = "cricket") =>
  renderHook(() => useMatchResult(venue)).result.current;

describe("useMatchResult", () => {
  it("saves the score and form, and says when the matchday is complete (F3)", () => {
    const { save } = setup("cricket");
    expect(save({ score: "14* NOT OUT", form: 0 })).toEqual({
      offerHighlight: false,
      fullTime: false,
    });
    setup("tennis").save({ score: "GAME YASH", form: 1 / 3 });
    expect(setup("badminton").save({ score: "21–19", form: 0.25 })).toEqual({
      offerHighlight: false,
      fullTime: true,
    });
    expect(useMatchRecord.getState().bestForm).toEqual({
      cricket: 0,
      tennis: 1 / 3,
      badminton: 0.25,
    });
  });

  it("offers the highlight on the second loss, not the first, and saves each game", () => {
    const { save } = setup();
    expect(save({ score: "14* NOT OUT", form: 0 })).toEqual({
      offerHighlight: false,
      fullTime: false,
    });
    expect(save({ score: "4* NOT OUT", form: 1 / 3 })).toEqual({
      offerHighlight: true,
      fullTime: false,
    });
    const s = useMatchRecord.getState();
    expect(s.yashWins).toBe(2);
    expect(s.venuesPlayed).toEqual(["cricket"]);
    expect(s.lastScores.cricket).toBe("4* NOT OUT");
  });

  it("counts losses per venue", () => {
    setup("cricket").save({ score: "a", form: 0 });
    expect(setup("tennis").save({ score: "b", form: 0 }).offerHighlight).toBe(false);
  });

  it("still returns, and the store holds the result, when storage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const { save } = setup();
    expect(save({ score: "14* NOT OUT", form: 0 })).toEqual({
      offerHighlight: false,
      fullTime: false,
    });
    expect(useMatchRecord.getState().yashWins).toBe(1);
  });

  it("still ends the game when the record throws: no full time from a failed save", () => {
    const original = useMatchRecord.getState().completeMatch;
    useMatchRecord.setState({
      completeMatch: () => {
        throw new Error("blocked");
      },
    });
    try {
      expect(setup("cricket").save({ score: "14* NOT OUT", form: 0 })).toEqual({
        offerHighlight: false,
        fullTime: false,
      });
    } finally {
      useMatchRecord.setState({ completeMatch: original });
    }
  });

  it("the third venue's save, with the record throwing, does not throw and offers no Full Time", () => {
    setup("cricket").save({ score: "14* NOT OUT", form: 0 });
    setup("tennis").save({ score: "GAME YASH", form: 0 });
    const original = useMatchRecord.getState().completeMatch;
    useMatchRecord.setState({
      completeMatch: () => {
        throw new Error("blocked");
      },
    });
    try {
      let flags: EndFlags | undefined;
      expect(() => {
        flags = setup("badminton").save({ score: "21–19", form: 0.25 });
      }).not.toThrow();
      expect(flags).toEqual({ offerHighlight: false, fullTime: false });
    } finally {
      useMatchRecord.setState({ completeMatch: original });
    }
    expect(useMatchRecord.getState().venuesPlayed).toEqual(["cricket", "tennis"]);
  });

  // The in-memory path (storage blocked for the whole visit) is covered end to end by the full-matchday journey.
  it("the third venue's save with storage throwing still completes the matchday (F3)", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    setup("cricket").save({ score: "14* NOT OUT", form: 0 });
    setup("tennis").save({ score: "GAME YASH", form: 0 });
    expect(setup("badminton").save({ score: "21–19", form: 0.25 }).fullTime).toBe(true);
  });
});
