import { describe, expect, it } from "vitest";
import type { Judged, PickCall } from "../../engine/pick";
import type { Quality } from "../../engine/types";
import {
  boxOf,
  chargedOf,
  MATCH_START,
  matchOver,
  needsSecond,
  playRally,
  scoreOf,
  serverOf,
  smashKmh,
  windowMs,
  type MatchState,
} from "./match";

const P = (q: Quality, call: PickCall): Judged => ({ q, call });
const perfect = P("perfect", "perfect");
const wrong = P("miss", "wrong");
const late = P("miss", "late");

/** Plays a whole game, each pick chosen from the state. */
function playOut(pick: (s: MatchState) => Judged): MatchState {
  let s = MATCH_START;
  while (!matchOver(s)) {
    const a = pick(s);
    s = playRally(s, needsSecond(s, a) ? [a, pick(s)] : [a]);
  }
  return s;
}

/** Two rallies Yash wins with no input: the next one, his third win, is the Data (dive) rally. */
const beforeDive = () => [late, late].reduce((s, p) => playRally(s, [p]), MATCH_START);

describe("badminton 3D rules", () => {
  it("no input: four rallies, 21–19; Backend, Frontend, Data and Craft charge in order", () => {
    const s = playOut(() => late);
    expect(scoreOf(s)).toEqual({ yash: 21, you: 19 });
    expect(s.rallies.map((r) => r.kind)).toEqual(["smash", "drop", "dive", "placement"]);
    expect(s.rallies.map((r) => r.card)).toEqual([0, 1, 2, 3]);
    expect(s.rallies.map((r) => r.shots)).toEqual([3, 3, 3, 3]);
  });

  it("perfect picks: 22–20 in six rallies: WINNER, OUT, HE READ IT, WHAT A DIVE, HE READ IT, HE READ IT", () => {
    const s = playOut(() => perfect);
    expect(scoreOf(s)).toEqual({ yash: 22, you: 20 });
    expect(s.rallies.map((r) => r.call)).toEqual(["winner", "out", "read", "dive", "read", "read"]);
    expect(s.rallies.map((r) => r.server)).toEqual(["yash", "you", "yash", "yash", "yash", "yash"]);
    expect(s.rallies.map((r) => r.kind)).toEqual([
      "smash",
      "smash",
      "drop",
      "dive",
      "placement",
      "final",
    ]);
    expect(s.rallies.map((r) => r.card)).toEqual([null, 0, 1, 2, 3, null]);
    expect(s.rallies.map((r) => r.shots)).toEqual([4, 5, 3, 3, 3, 5]);
  });

  it("whatever you press, Yash wins 21–19 or 22–20, you never pass 20, and a rally has at most 2 picks and 6 shots", () => {
    const options = [perfect, wrong, late];
    let games = 0;
    const walk = (s: MatchState) => {
      if (matchOver(s)) {
        games += 1;
        const { yash, you } = scoreOf(s);
        expect(`${yash}–${you}`).toMatch(/^(21–19|22–20)$/);
        expect(s.rallies.filter((r) => r.call === "out").length).toBeLessThanOrEqual(1);
        expect(s.rallies.some((r) => r.kind === "final" && r.call === "out")).toBe(false);
        expect(s.rallies.length).toBeLessThanOrEqual(6);
        expect(s.rallies.every((r) => r.shots <= 6 && r.picks.length <= 2)).toBe(true);
        expect(s.rallies.flatMap((r) => (r.card === null ? [] : [r.card]))).toEqual([0, 1, 2, 3]);
        return;
      }
      for (const a of options) {
        if (needsSecond(s, a)) for (const b of options) walk(playRally(s, [a, b]));
        else walk(playRally(s, [a]));
      }
    };
    walk(MATCH_START);
    expect(games).toBeGreaterThan(100);
  }, 30_000);

  it("a rally is yours only with two good picks, on 19, outside the Data rally", () => {
    const won = playRally(MATCH_START, [perfect, perfect]);
    expect(won.rallies[0]).toMatchObject({ winner: "you", call: "winner", card: null });
    const s = beforeDive();
    expect(needsSecond(s, perfect)).toBe(false);
    expect(playRally(s, [perfect]).rallies[2]).toMatchObject({ winner: "yash", call: "dive" });
  });

  it("the Data rally: a good, late or early pick brings the dive; a wrong one is blocked", () => {
    const s = beforeDive();
    const last = (p: Judged) => playRally(s, [p]).rallies[2];
    expect(last(perfect)).toMatchObject({ winner: "yash", call: "dive", card: 2 });
    expect(last(late)).toMatchObject({ winner: "yash", call: "late", card: 2 });
    expect(last(wrong)).toMatchObject({ winner: "yash", call: "wrong", card: 2 });
  });

  it("real serving: the winner serves, from the right box on an even score", () => {
    expect(serverOf(MATCH_START)).toBe("yash");
    expect(boxOf(MATCH_START)).toBe("left");
    const s = playRally(MATCH_START, [perfect, perfect]);
    expect(serverOf(s)).toBe("you");
    expect(boxOf(s)).toBe("right");
    expect(chargedOf(s)).toBe(0);
  });

  it("windows shrink with Yash's wins and are 25 % longer on the column", () => {
    expect(windowMs(0, MATCH_START, "stage")).toBe(1300);
    expect(windowMs(1, MATCH_START, "column")).toBe(1250);
    const four = [late, late, late, late].reduce((s, p) => playRally(s, [p]), MATCH_START);
    expect(windowMs(0, four, "stage")).toBe(900);
  });

  it("the speed gun reads only Yash's smashes", () => {
    expect(smashKmh("smash")).toBe(348);
    expect(smashKmh("final")).toBe(365);
    expect(smashKmh("drop")).toBeNull();
  });
});
