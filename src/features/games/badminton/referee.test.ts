import { describe, expect, it, vi } from "vitest";
import { MAX_GAME_MS, VERDICT_MS } from "../engine/beats";
import type { Luck } from "../engine/types";
import {
  BADMINTON_AUTO,
  BADMINTON_BEATS,
  BADMINTON_RALLIES,
  BADMINTON_START_STATE,
  POWER,
  badmintonScore,
  badmintonWinner,
  matchPoint,
  playRally,
  powerAt,
  shotFor,
  weightQuality,
  type BadmintonState,
} from "./referee";

const play = (powers: readonly number[], luck: Luck = () => 0.99): BadmintonState =>
  powers.reduce((s, p) => playRally(s, p, luck), BADMINTON_START_STATE);

describe("powerAt", () => {
  it("bounces the meter between 8 and 86", () => {
    expect(powerAt(0)).toBe(8);
    expect(powerAt(1400)).toBe(86);
    expect(powerAt(700)).toBe(47);
    expect(powerAt(2800)).toBe(8);
  });
});

describe("shotFor", () => {
  it("cuts the meter into smash, clear and drop", () => {
    expect(shotFor(80)).toBe("smash");
    expect(shotFor(79.9)).toBe("clear");
    expect(shotFor(40)).toBe("clear");
    expect(shotFor(39.9)).toBe("drop");
    expect(shotFor(8)).toBe("drop");
  });
});

describe("weightQuality", () => {
  it("only the 20-26 band is perfect", () => {
    expect(weightQuality(20)).toBe("perfect");
    expect(weightQuality(26)).toBe("perfect");
    expect(weightQuality(19.9)).toBe("good");
    expect(weightQuality(26.1)).toBe("good");
    expect(weightQuality(85)).toBe("good");
  });
});

describe("playRally", () => {
  it("rallies 1-3 are Yash's, called by the shot or a perfect drop", () => {
    const s = play([85, 50, 30]);
    expect(s.rallies.map((r) => r.call)).toEqual(["smash", "clear", "drop"]);
    expect(play([22]).rallies[0]).toEqual({ shot: "drop", q: "perfect", call: "perfect" });
  });

  it("the score runs 17-19, 18-19, 19-19, 20-19", () => {
    const scores = [0, 1, 2, 3].map((n) => badmintonScore(play([50, 50, 50].slice(0, n))));
    expect(scores).toEqual([
      { yash: 17, you: 19 },
      { yash: 18, you: 19 },
      { yash: 19, you: 19 },
      { yash: 20, you: 19 },
    ]);
  });

  it("rally 4, forced win: perfect drops all the way and a low roll get through", () => {
    const s = play([22, 22, 22, 22], () => 0);
    expect(s.rallies[3]!.call).toBe("through");
    expect(s.won).toBe(true);
    expect(badmintonScore(s)).toEqual({ yash: 20, you: 20 });
    expect(badmintonWinner(s)).toBe("you");
  });

  it("rally 4, otherwise: 21-19 and the call follows the shot", () => {
    const s = play([22, 22, 22, 85], () => 0);
    expect(s.rallies[3]!.call).toBe("smash");
    expect(badmintonScore(s)).toEqual({ yash: 21, you: 19 });
    expect(badmintonWinner(s)).toBe("yash");
    expect(play([22, 22, 22, 22], () => 0.5).rallies[3]!.call).toBe("drop");
  });

  it("does not roll luck unless the streak is perfect", () => {
    const luck = vi.fn(() => 0);
    play([22, 50, 22, 22], luck);
    expect(luck).not.toHaveBeenCalled();
  });

  it("returns the same state after the game", () => {
    const s = play([50, 50, 50, 50]);
    expect(playRally(s, 22, () => 0)).toBe(s);
  });
});

describe("matchPoint", () => {
  it("is true only before rally 4", () => {
    expect([0, 1, 2, 3, 4].map((n) => matchPoint(play(Array(n).fill(50))))).toEqual([
      false,
      false,
      false,
      true,
      false,
    ]);
  });
});

describe("the reduced-motion rally", () => {
  it("is clear, smash, drop, drop, 21-19, and Yash wins", () => {
    const s = play(BADMINTON_AUTO);
    expect(s.rallies.map((r) => r.call)).toEqual(["clear", "smash", "drop", "drop"]);
    expect(badmintonScore(s)).toEqual({ yash: 21, you: 19 });
    expect(badmintonWinner(s)).toBe("yash");
  });
});

describe("fair play", () => {
  it("fits the 15 s cap", () => {
    expect(
      BADMINTON_RALLIES * (POWER.periodMs + BADMINTON_BEATS.flightMs + BADMINTON_BEATS.callMs) +
        VERDICT_MS,
    ).toBeLessThanOrEqual(MAX_GAME_MS);
  });
});
