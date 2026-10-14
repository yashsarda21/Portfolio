import { describe, expect, it } from "vitest";
import { MAX_GAME_MS, VERDICT_MS } from "../engine/beats";
import {
  SERVE_WINDOW_MS,
  TELL_MS,
  TENNIS_AUTO_SHARE,
  TENNIS_BEATS,
  TENNIS_SERVES,
  TENNIS_START,
  tennisOver,
  TOSS_MS,
  newServe,
  playReturn,
  returnQuality,
  tennisPoints,
  windowFor,
  type ReturnPick,
  type Side,
  type TennisState,
} from "./referee";

/** Plays one serve whose open side is `open`, with the return picked at `atMs` on `side`. */
const serveAndReturn = (s: TennisState, pick: ReturnPick, open: Side = "right"): TennisState =>
  playReturn({ ...s, serve: { open, tossMs: 500 } }, pick, "stage");

describe("windowFor", () => {
  it("shrinks each serve and stretches on touch", () => {
    expect(windowFor(0, "stage")).toBe(900);
    expect(windowFor(2, "stage")).toBe(500);
    expect(windowFor(1, "column")).toBe(875);
  });
});

describe("newServe", () => {
  it("draws the open side and the toss from luck", () => {
    expect(newServe(TENNIS_START, () => 0).serve).toEqual({ open: "left", tossMs: 400 });
    const late = newServe(TENNIS_START, () => 0.99).serve!;
    expect(late.open).toBe("right");
    expect(late.tossMs).toBeCloseTo(895, 5);
  });

  it("serves nothing once the game is over", () => {
    const over: TennisState = {
      serve: null,
      returns: Array(TENNIS_SERVES).fill({ q: "good", call: "returned" }),
    };
    expect(newServe(over, () => 0)).toBe(over);
  });
});

describe("returnQuality", () => {
  it("judges side and timing against the window", () => {
    expect(returnQuality({ side: "right", atMs: 0 }, "right", 900)).toEqual({
      q: "perfect",
      call: "clean",
    });
    expect(returnQuality({ side: "right", atMs: 360 }, "right", 900)).toEqual({
      q: "perfect",
      call: "clean",
    });
    expect(returnQuality({ side: "right", atMs: 361 }, "right", 900)).toEqual({
      q: "good",
      call: "returned",
    });
    expect(returnQuality({ side: "right", atMs: 900 }, "right", 900)).toEqual({
      q: "good",
      call: "returned",
    });
    expect(returnQuality({ side: "right", atMs: 901 }, "right", 900)).toEqual({
      q: "miss",
      call: "ace",
    });
    expect(returnQuality({ side: "left", atMs: 100 }, "right", 900)).toEqual({
      q: "miss",
      call: "wrong",
    });
    expect(returnQuality({ side: "right", atMs: -1 }, "right", 900)).toEqual({
      q: "miss",
      call: "early",
    });
    expect(returnQuality({ side: null, atMs: 900 }, "right", 900)).toEqual({
      q: "miss",
      call: "ace",
    });
  });
});

describe("playReturn", () => {
  it("serves 1-2: appends the return and clears the serve", () => {
    const s = serveAndReturn(TENNIS_START, { side: "right", atMs: 100 });
    expect(s.returns).toEqual([{ q: "perfect", call: "clean" }]);
    expect(s.serve).toBeNull();
    const s2 = serveAndReturn(s, { side: "right", atMs: 600 });
    expect(s2.returns[1]).toEqual({ q: "good", call: "returned" });
  });

  it("three perfect returns: serve 3 still clips the line (F1)", () => {
    let s = TENNIS_START;
    for (let i = 0; i < TENNIS_SERVES; i++) {
      s = newServe(s, () => 0); // open: left
      s = playReturn(s, { side: "left", atMs: 1 }, "stage");
    }
    expect(s.returns.map((r) => r.call)).toEqual(["clean", "clean", "line"]);
    expect(s.returns.every((r) => r.q === "perfect")).toBe(true);
    expect(tennisOver(s)).toBe(true);
  });

  it("does nothing with no serve in play", () => {
    expect(playReturn(TENNIS_START, { side: "right", atMs: 0 }, "stage")).toBe(TENNIS_START);
  });
});

describe("tennisPoints", () => {
  it("narrates Yash's service game", () => {
    const pick: ReturnPick = { side: "right", atMs: 600 };
    const s0 = TENNIS_START;
    const s1 = serveAndReturn(s0, pick);
    const s2 = serveAndReturn(s1, pick);
    const s3 = serveAndReturn(s2, pick);
    expect(tennisPoints(s0)).toEqual(["15", "15"]);
    expect(tennisPoints(s1)).toEqual(["30", "15"]);
    expect(tennisPoints(s2)).toEqual(["40", "30"]);
    expect(tennisPoints(s3)).toEqual(["40", "30"]);
  });
});

describe("the reduced-motion rally", () => {
  it("picks the open side at 60 % of each window: good, good, line", () => {
    let s = TENNIS_START;
    for (let i = 0; i < TENNIS_SERVES; i++) {
      const atMs = windowFor(i, "stage") * TENNIS_AUTO_SHARE;
      s = serveAndReturn(s, { side: "right", atMs });
    }
    expect(s.returns.map((r) => r.call)).toEqual(["returned", "returned", "line"]);
    expect(s.returns.map((r) => r.q)).toEqual(["good", "good", "good"]);
  });
});

describe("fair play", () => {
  it("fits the 15 s cap on the longest (touch) layout", () => {
    let total = VERDICT_MS + TENNIS_BEATS.firstMs;
    for (let i = 0; i < SERVE_WINDOW_MS.length; i++) {
      total += TELL_MS + TOSS_MS.max + windowFor(i, "column") + TENNIS_BEATS.callMs;
    }
    expect(total).toBeLessThanOrEqual(MAX_GAME_MS);
  });
});
