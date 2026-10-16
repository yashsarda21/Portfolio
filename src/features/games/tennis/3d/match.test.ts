import { describe, expect, it } from "vitest";
import type { TennisReturn } from "../referee";
import {
  courtOf,
  decidePoint,
  MATCH_START,
  matchOver,
  playPoint,
  scoreOf,
  serveKmh,
  unlockedOf,
  windowMs,
  yashPoints,
  yourPoints,
  type MatchState,
} from "./match";

const ace: TennisReturn = { q: "miss", call: "ace" };
const early: TennisReturn = { q: "miss", call: "early" };
const wrong: TennisReturn = { q: "miss", call: "wrong" };
const clean: TennisReturn = { q: "perfect", call: "clean" };
const good: TennisReturn = { q: "good", call: "returned" };

const play = (points: TennisReturn[][]): MatchState =>
  points.reduce((s, inputs) => playPoint(s, inputs), MATCH_START);

describe("one point (spec §3.2)", () => {
  it("ends within 4 shots, with the call for how it ended", () => {
    const s = MATCH_START;
    expect(decidePoint(s, [ace])).toMatchObject({ winner: "yash", call: "ace", shots: 1 });
    expect(decidePoint(s, [early])).toMatchObject({ winner: "yash", call: "early", shots: 1 });
    expect(decidePoint(s, [wrong])).toMatchObject({ winner: "yash", call: "wrong", shots: 3 });
    expect(decidePoint(s, [good, ace])).toMatchObject({ winner: "yash", call: "late", shots: 3 });
    expect(decidePoint(s, [good, early])).toMatchObject({
      winner: "yash",
      call: "early",
      shots: 3,
    });
    expect(decidePoint(s, [good, wrong])).toMatchObject({
      winner: "yash",
      call: "wrong",
      shots: 4,
    });
    expect(decidePoint(s, [clean, good])).toMatchObject({
      winner: "you",
      call: "winner",
      shots: 4,
    });
  });
  it("needs your second shot after a good return", () => {
    expect(() => decidePoint(MATCH_START, [good])).toThrow();
  });
  it("once you have 30, your best shot is OUT", () => {
    const at30 = play([
      [clean, clean],
      [good, good],
    ]);
    expect(yourPoints(at30)).toBe(2);
    expect(decidePoint(at30, [clean, clean])).toMatchObject({
      winner: "yash",
      call: "out",
      shots: 4,
    });
  });
});

describe("the game (spec §3.3)", () => {
  it("no input at all: four aces, 40–0, GAME", () => {
    const s = play([[ace], [ace], [ace], [ace]]);
    expect(matchOver(s)).toBe(true);
    expect(scoreOf(s)).toEqual(["40", "0"]);
    expect(s.points.map((p) => p.call)).toEqual(["ace", "ace", "ace", "ace"]);
  });
  it("perfect play: you win two points, then four OUTs: 40–30, GAME", () => {
    const s = play(Array.from({ length: 6 }, () => [clean, clean]));
    expect(s.points.map((p) => p.call)).toEqual(["winner", "winner", "out", "out", "out", "out"]);
    expect(matchOver(s)).toBe(true);
    expect(scoreOf(s)).toEqual(["40", "30"]);
  });
  it("Yash always wins and you never pass 30, whatever is played", () => {
    const options = [
      [ace],
      [early],
      [wrong],
      [good, ace],
      [good, wrong],
      [clean, good],
      [good, clean],
    ];
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let game = 0; game < 300; game++) {
      let s = MATCH_START;
      while (!matchOver(s)) s = playPoint(s, options[Math.floor(rand() * options.length)]!);
      expect(yashPoints(s)).toBe(4);
      expect(yourPoints(s)).toBeLessThanOrEqual(2);
      for (const p of s.points) expect(p.shots).toBeLessThanOrEqual(4);
    }
  });
  it("a finished game takes no more points", () => {
    const s = play([[ace], [ace], [ace], [ace]]);
    expect(playPoint(s, [clean, clean])).toBe(s);
  });
  it("Yash's points unlock the projects at 15, 30 and 40", () => {
    expect(unlockedOf(play([[clean, clean]]))).toBe(0);
    expect(unlockedOf(play([[ace]]))).toBe(1);
    expect(unlockedOf(play([[ace], [ace], [ace]]))).toBe(3);
    expect(unlockedOf(play([[ace], [ace], [ace], [ace]]))).toBe(3);
  });
  it("serves from the deuce court on even points and the ad court on odd ones", () => {
    expect(courtOf(MATCH_START)).toBe("deuce");
    expect(courtOf(play([[ace]]))).toBe("ad");
  });
  it("the windows shrink and the serve speeds up as Yash's score rises; the column gets 25% longer", () => {
    expect(windowMs("serve", MATCH_START, "stage")).toBe(1000);
    expect(windowMs("rally", MATCH_START, "stage")).toBe(1100);
    const at40 = play([[ace], [ace], [ace]]);
    expect(windowMs("serve", at40, "stage")).toBe(700);
    expect(windowMs("rally", at40, "column")).toBe(1000);
    expect(serveKmh(MATCH_START)).toBe(178);
    expect(serveKmh(at40)).toBe(196);
  });
});
