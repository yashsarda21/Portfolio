import { describe, expect, it, vi } from "vitest";
import { seeded } from "@/lib/seeded";
import { MAX_GAME_MS, VERDICT_MS } from "../engine/beats";
import type { Luck, Quality } from "../engine/types";
import {
  CRICKET_AUTO,
  CRICKET_BALLS,
  CRICKET_BEATS,
  CRICKET_PERIOD_MS,
  CRICKET_START,
  bowl,
  cricketOver,
  cricketRuns,
  cricketWinner,
  lengthQuality,
  type CricketState,
} from "./referee";

const play = (qs: Quality[], luck: Luck = () => 0.99): CricketState =>
  qs.reduce((s, q) => bowl(s, q, luck), CRICKET_START);

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

  it("ball 3, forced win: three perfect balls and a low roll bowl him", () => {
    const s = play(["perfect", "perfect", "perfect"], () => 0);
    expect(s.balls[2]).toMatchObject({ call: "bowled", runs: 0, forYou: true, line: "bowled" });
    expect(s.won).toBe(true);
    expect(cricketWinner(s)).toBe("you");
  });

  it("ball 3, forced loss: three perfect balls and a high roll still go for four", () => {
    const s = play(["perfect", "perfect", "perfect"], () => 0.5);
    expect(s.balls[2]).toMatchObject({ call: "four", line: "lastPerfect" });
    expect(s.won).toBe(false);
    expect(cricketWinner(s)).toBe("yash");
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

  it("never rolls luck unless the streak is perfect", () => {
    const luck = vi.fn(() => 0);
    play(["perfect", "good", "perfect"], luck);
    expect(luck).not.toHaveBeenCalled();
  });

  it("returns the same state after the over", () => {
    const s = play(["good", "good", "good"]);
    expect(cricketOver(s)).toBe(true);
    expect(bowl(s, "perfect", () => 0)).toBe(s);
  });
});

describe("the over", () => {
  it("scores the Hub artboard's 14*", () => {
    expect(cricketRuns(play(["good", "miss", "good"]))).toBe(14);
  });

  it("the reduced-motion over is 14* and Yash wins", () => {
    const s = play(CRICKET_AUTO);
    expect(cricketRuns(s)).toBe(14);
    expect(cricketWinner(s)).toBe("yash");
  });

  it("has no winner until the over is done", () => {
    expect(cricketWinner(play(["perfect"]))).toBeNull();
  });

  it("is the 1 %: an always-perfect player wins about 12 % of overs", () => {
    const luck = seeded(42);
    let wins = 0;
    const overs = 20_000;
    for (let i = 0; i < overs; i++) if (play(["perfect", "perfect", "perfect"], luck).won) wins++;
    expect(wins / overs).toBeGreaterThan(0.1);
    expect(wins / overs).toBeLessThan(0.14);
  });

  it("fits the 15 s fair-play cap", () => {
    expect(
      CRICKET_BALLS * (CRICKET_PERIOD_MS + CRICKET_BEATS.flightMs + CRICKET_BEATS.callMs) +
        VERDICT_MS,
    ).toBeLessThanOrEqual(MAX_GAME_MS);
  });
});
