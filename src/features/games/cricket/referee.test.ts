import { describe, expect, it } from "vitest";
import { MAX_GAME_MS, VERDICT_MS } from "../engine/beats";
import type { Quality } from "../engine/types";
import {
  CRICKET_AUTO,
  CRICKET_BALLS,
  CRICKET_BEATS,
  CRICKET_PERIOD_MS,
  CRICKET_START,
  bowl,
  cricketOver,
  cricketRuns,
  lengthQuality,
  type CricketState,
} from "./referee";

const play = (qs: Quality[]): CricketState => qs.reduce((s, q) => bowl(s, q), CRICKET_START);

describe("lengthQuality", () => {
  it("judges the stage zones", () => {
    expect(lengthQuality(0.5, "stage")).toBe("perfect");
    expect(lengthQuality(0.5 + 0.0349, "stage")).toBe("perfect");
    expect(lengthQuality(0.5 + 0.035, "stage")).toBe("good");
    expect(lengthQuality(0.5 - 0.1199, "stage")).toBe("good");
    expect(lengthQuality(0.5 + 0.12, "stage")).toBe("miss");
  });

  it("judges the wider touch zones", () => {
    expect(lengthQuality(0.5 + 0.049, "column")).toBe("perfect");
    expect(lengthQuality(0.5 + 0.139, "column")).toBe("good");
    expect(lengthQuality(0, "column")).toBe("miss");
  });
});

describe("bowl", () => {
  it("balls 1-2: perfect is a dot, good a four, miss a six", () => {
    expect(play(["perfect"]).balls[0]).toEqual({
      q: "perfect",
      call: "dot",
      runs: 0,
      forYou: true,
      line: "dot",
    });
    expect(play(["good"]).balls[0]).toMatchObject({ call: "four", runs: 4, line: "four" });
    expect(play(["miss"]).balls[0]).toMatchObject({ call: "six", runs: 6, line: "six" });
    expect(play(["perfect", "miss"]).balls[1]).toMatchObject({ call: "six", runs: 6, line: "six" });
  });

  it("three perfect balls still end FOUR on the last: Yash is 4 not out (F1)", () => {
    let s = CRICKET_START;
    for (let i = 0; i < CRICKET_BALLS; i++) s = bowl(s, "perfect");
    expect(s.balls.map((b) => b.call)).toEqual(["dot", "dot", "four"]);
    expect(s.balls.at(-1)!.line).toBe("lastPerfect");
    expect(cricketRuns(s)).toBe(4);
    expect(cricketOver(s)).toBe(true);
  });

  it("ball 3 lines follow the quality", () => {
    expect(play(["perfect", "perfect", "good"]).balls[2]).toMatchObject({
      call: "four",
      line: "lastGood",
    });
    expect(play(["perfect", "perfect", "miss"]).balls[2]).toMatchObject({
      call: "six",
      line: "lastSix",
    });
  });

  it("returns the same state after the over", () => {
    const s = play(["good", "good", "good"]);
    expect(cricketOver(s)).toBe(true);
    expect(bowl(s, "perfect")).toBe(s);
  });
});

describe("the over", () => {
  it("scores the Hub artboard's 14*", () => {
    expect(cricketRuns(play(["good", "miss", "good"]))).toBe(14);
  });

  it("the reduced-motion over is 14*", () => {
    expect(cricketRuns(play(CRICKET_AUTO))).toBe(14);
  });

  it("fits the 15 s fair-play cap", () => {
    expect(
      CRICKET_BALLS * (CRICKET_PERIOD_MS + CRICKET_BEATS.flightMs + CRICKET_BEATS.callMs) +
        VERDICT_MS,
    ).toBeLessThanOrEqual(MAX_GAME_MS);
  });
});
