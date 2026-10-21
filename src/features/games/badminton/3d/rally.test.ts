import { describe, expect, it } from "vitest";
import type { Judged, PickCall } from "../../engine/pick";
import type { GameLayout, Luck, Quality } from "../../engine/types";
import { FOOTWORK } from "../../three/footwork";
import { ground, toWorld } from "../../three/geometry";
import { COURT, type Vec3 } from "./court";
import {
  decideRally,
  judge,
  MATCH_START,
  matchOver,
  needsSecond,
  outUsed,
  playRally,
  scoreOf,
  serverOf,
  type Dir,
  type MatchState,
} from "./match";
import type { Reach } from "./reach";
import {
  scriptRally,
  setupRally,
  type Decided,
  type Decision,
  type RallyScript,
  type RallySetup,
  type Swing,
  type Window,
} from "./rally";
import { netGap, NET_CLEAR, NET_SKIM, OUT_BY } from "./shuttle";
import { DIVE_CLIP, DIVE_LANDS, SWING_LEAD } from "./timing";

/** The reach Task 6 measured on the real athlete (body frame: x his left, y up, z his front). */
const REACH: Reach = {
  serve: [-0.036, 0.716, 0.456],
  overhead: [-0.212, 2.476, 0.19],
  jumpSmash: [-0.223, 2.896, 0.419],
  net: [-0.187, 1.366, 1.612],
  lift: [-0.253, 0.679, 1.553],
  block: [0.163, 1.203, 0.622],
  dive: [-0.215, 0.239, 2.782],
  hold: [-0.038, 1.1, 0.455],
};

const P = (q: Quality, call: PickCall): Judged => ({ q, call });
const perfect = P("perfect", "perfect");
const wrong = P("miss", "wrong");
const late = P("miss", "late");
const early = P("miss", "early");
const PICKS = [perfect, wrong, late, early];

/** Every way a rally can go from `s`: each first pick, and each second one when it brings one. */
const pathsOf = (s: MatchState): Judged[][] =>
  PICKS.flatMap((a) => (needsSecond(s, a) ? PICKS.map((b) => [a, b]) : [[a]]));
/** Every state a game can reach (the same score, server and OUT play the same). */
function reachable(): MatchState[] {
  const seen = new Map<string, MatchState>();
  const walk = (s: MatchState) => {
    const { yash, you } = scoreOf(s);
    const key = `${yash}-${you}-${serverOf(s)}-${outUsed(s)}`;
    if (matchOver(s) || seen.has(key)) return;
    seen.set(key, s);
    for (const picks of pathsOf(s)) walk(playRally(s, picks));
  };
  walk(MATCH_START);
  return [...seen.values()];
}
/** A fixed luck: a constant, or a small seeded generator (mulberry32). */
const constant =
  (v: number): Luck =>
  () =>
    v;
function seeded(seed: number): Luck {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const LUCKS = [constant(0), constant(0.5), constant(0.999), seeded(7), seeded(42)];
const LAYOUTS: GameLayout[] = ["stage", "column"];

const other = (d: Dir): Dir => (d === "deep" ? "short" : "deep");
/** A pick as the screen makes it (early: before Yash's hit; late: the window runs out), judged as the game judges it. */
function decision(j: Judged, w: Window): Decision {
  const span = w.commits - w.opens;
  const pick =
    j.call === "early"
      ? { dir: w.open, at: w.opens - 0.1 }
      : j.call === "late"
        ? { dir: null, at: w.commits }
        : j.call === "wrong"
          ? { dir: other(w.open), at: w.opens + span * 0.5 }
          : { dir: w.open, at: w.opens + span * 0.2 };
  const judged = judge({ dir: pick.dir, atMs: (pick.at - w.opens) * 1000 }, w.open, span * 1000);
  expect(judged).toEqual(j);
  return { j, ...pick };
}
/** Plays the picks one by one, as the game does: the script is rebuilt once each pick is judged. */
function play(setup: RallySetup, picks: Judged[]) {
  const scripts: RallyScript[] = [scriptRally(setup, {}, REACH)];
  const decided: Decided = {};
  decided.first = decision(picks[0]!, scripts[0]!.windows[0]!);
  scripts.push(scriptRally(setup, { ...decided }, REACH));
  if (picks[1]) {
    decided.second = decision(picks[1], scripts[1]!.windows[1]!);
    scripts.push(scriptRally(setup, { ...decided }, REACH));
  }
  return { scripts, decided, script: scripts.at(-1)! };
}
interface Case {
  s: MatchState;
  setup: RallySetup;
  picks: Judged[];
}
const CASES: Case[] = reachable().flatMap((s) =>
  LAYOUTS.flatMap((layout) =>
    LUCKS.flatMap((luck) => {
      const setup = setupRally(s, layout, luck);
      return pathsOf(s).map((picks) => ({ s, setup, picks }));
    }),
  ),
);
/** Runs `check` on every case's final script; returns the first failures. */
function sweep(check: (script: RallyScript, c: Case) => string | null) {
  const bad: string[] = [];
  for (const c of CASES) {
    const why = check(play(c.setup, c.picks).script, c);
    if (why && bad.length < 10)
      bad.push(`${c.setup.kind} ${JSON.stringify(c.setup)} ${c.picks.map((p) => p.call)}: ${why}`);
  }
  return bad;
}

const gap = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const sweet = (w: Swing) => toWorld(w.spot, w.face, REACH[w.kind as "overhead"]);
/** The flight arriving at `t` (started before it) and the one leaving at `t` (started exactly then). */
const arriving = (s: RallyScript, t: number) => s.flights.filter((f) => f.start < t - 1e-9).at(-1);
const leaving = (s: RallyScript, t: number) => s.flights.find((f) => Math.abs(f.start - t) < 1e-9);
const SKIMS = new Set(["net", "dive", "block"]);
const yashMeets = (s: RallyScript) => s.swings.filter((w) => w.by === "yash" && w.meets);

describe("scriptRally: the shots", () => {
  it("the shuttle is at the striker's sweet spot at every contact", () => {
    const bad = sweep((s) => {
      for (const f of s.flights)
        if (!s.swings.some((w) => w.meets && Math.abs(w.contact - f.start) < 1e-9))
          return `the flight at ${f.start} leaves no racket`;
      for (const w of s.swings) {
        if (!w.meets) continue;
        const into = arriving(s, w.contact);
        const out = leaving(s, w.contact);
        if (!out) return `${w.by} ${w.kind} sends nothing on`;
        const at = (f: typeof into) => f!.path.at(w.contact - f!.start);
        // A frame shot (ruling P7) meets the shuttle on its path, off the strings: it leaves from where it was met.
        if (w.frame) {
          if (into && out && gap(at(into), at(out)) > 0.01) return "the frame shot jumps";
          continue;
        }
        for (const f of [into, out]) {
          if (!f || (f === into && w.kind === "serve")) continue;
          const off = gap(at(f), sweet(w));
          if (off > 0.01) return `${w.by} ${w.kind} at ${w.contact.toFixed(3)} is ${off} m off`;
        }
      }
      return null;
    });
    expect(bad).toEqual([]);
  }, 30_000);

  it("every overhead flight clears the net by NET_CLEAR; net shots and scoops by NET_SKIM", () => {
    const bad = sweep((s) => {
      for (const [i, f] of s.flights.entries()) {
        const by = s.swings.find((w) => w.meets && Math.abs(w.contact - f.start) < 1e-9)!;
        const skim = SKIMS.has(by.kind) || (by.frame !== undefined && s.setup.kind === "dive");
        const lift = netGap(f.path);
        if (lift === null) return `flight ${i} never crosses the net`;
        if (lift < (skim ? NET_SKIM : NET_CLEAR))
          return `flight ${i} (${by.kind}) clears by ${lift}`;
      }
      return null;
    });
    expect(bad).toEqual([]);
  }, 30_000);

  it("every flight from Yash to you reaches your contact at the window's end plus SWING_LEAD", () => {
    const bad = sweep((s) => {
      for (const [i, w] of s.windows.entries()) {
        if (Math.abs(w.commits - w.opens - s.setup.windows[i]!) > 1e-9) return `window ${i} is off`;
        if (w.open !== s.setup.open[i]) return `window ${i} lights the wrong part`;
        const f = leaving(s, w.opens);
        const you = s.swings.find((x) => x.by === "you" && x.contact > w.opens);
        if (!f || !you || you.kind !== "overhead") return `window ${i} has no shot to you`;
        const off = gap(f.path.at(w.commits + SWING_LEAD - w.opens), sweet(you));
        if (off > 0.01) return `window ${i}'s shuttle is ${off} m off your racket`;
      }
      return null;
    });
    expect(bad).toEqual([]);
  }, 30_000);

  it("the serve's contact is below 1.15 m", () => {
    const bad = sweep((s) => {
      const serve = s.swings[0]!;
      if (serve.kind !== "serve" || serve.by !== s.setup.server)
        return "the rally does not open on the serve";
      if (s.flights[0]!.start !== s.serveAt) return "the serve's flight starts late";
      return s.flights[0]!.path.at(0)[1] < 1.15
        ? null
        : `contact ${s.flights[0]!.path.at(0)[1]} high`;
    });
    expect(bad).toEqual([]);
  }, 30_000);

  it("Yash is up from his dive before his next contact", () => {
    let dives = 0;
    const bad = sweep((s) => {
      const mine = yashMeets(s);
      const i = mine.findIndex((w) => w.kind === "dive");
      if (i < 0) return s.dive === null ? null : "a dive time with no dive";
      dives++;
      const dive = mine[i]!;
      if (s.dive !== dive.contact) return "the dive's time is not its contact";
      const next = mine[i + 1];
      if (!next) return null;
      const up = toWorld(dive.spot, dive.face, DIVE_LANDS);
      const need = DIVE_CLIP.up - DIVE_CLIP.contact + ground(up, next.spot) / FOOTWORK.sprint;
      return next.contact - dive.contact >= need
        ? null
        : `up ${need} s, plays at ${next.contact - dive.contact}`;
    });
    expect(bad).toEqual([]);
    expect(dives).toBeGreaterThan(0);
  }, 30_000);
});

describe("scriptRally: the rules", () => {
  it("shots match the rules", () => {
    for (const { s, setup, picks } of CASES) {
      expect(setup.open[1]).toBe("deep");
      if (setup.kind === "smash" || setup.kind === "final") expect(setup.open[0]).toBe("deep");
      if (setup.kind === "dive") expect(setup.open[0]).toBe("short");
      expect(setup.draws).toHaveLength(8);
      const { scripts, script } = play(setup, picks);
      expect(script.contacts.length).toBe(decideRally(s, picks).shots);
      expect(script.end).toEqual(expect.any(Number));
      scripts.slice(0, -1).forEach((pending) => expect(pending.end).toBeNull());
    }
  }, 30_000);

  it("the rally kinds end on their card shots", () => {
    const bad = sweep((s, { s: state, picks }) => {
      const { call } = decideRally(state, picks);
      if (call === "winner" || call === "out") return null;
      const last = yashMeets(s).at(-1)!;
      const kind = s.setup.kind;
      if ((kind === "smash" || kind === "final") && last.kind !== "jumpSmash")
        return `ends on ${last.kind}`;
      if (kind === "dive" && last.kind !== "dive" && last.kind !== "block")
        return `ends on ${last.kind}`;
      const lands = s.flights.at(-1)!.path.lands!;
      if (kind === "drop" && !(lands[2] > 0 && lands[2] <= 1.2))
        return `the drop lands at ${lands[2]}`;
      const inside = Math.abs(lands[0]) < COURT.singles && lands[2] > 0 && lands[2] < COURT.half;
      return inside ? null : `the card shot lands out at ${lands.join(", ")}`;
    });
    expect(bad).toEqual([]);
  }, 30_000);

  it("your winner lands in the empty court; on 20 it lands just OUT, with the mark there", () => {
    let outs = 0;
    const bad = sweep((s, { s: state, picks }) => {
      const { call } = decideRally(state, picks);
      if (call !== "winner" && call !== "out") return s.mark === null ? null : "a mark with no OUT";
      const last = s.flights.at(-1)!;
      const lands = last.path.lands!;
      const past = Math.max(Math.abs(lands[0]) - COURT.singles, -lands[2] - COURT.half);
      if (lands[2] >= 0) return "it lands on your side";
      if (call === "winner")
        return past < 0 && s.mark === null ? null : `the winner is out by ${past}`;
      outs++;
      if (past < OUT_BY.min - 1e-9 || past > OUT_BY.max + 1e-9) return `OUT by ${past}`;
      if (!s.mark || gap(s.mark.at, lands) > 1e-9) return "the mark is not where it lands";
      return Math.abs(s.mark.from - (last.start + last.path.end)) < 1e-9
        ? null
        : "the mark is early";
    });
    expect(bad).toEqual([]);
    expect(outs).toBeGreaterThan(0);
  }, 30_000);

  it("a rebuild never changes the past", () => {
    const same = (a: RallyScript, b: RallyScript, before: number) => {
      const fa = a.flights.filter((f) => f.start < before);
      const fb = b.flights.filter((f) => f.start < before);
      expect(fb.length).toBe(fa.length);
      fa.forEach((f, i) => {
        expect(fb[i]!.start).toBe(f.start);
        for (let t = f.start; t < before; t += 0.01)
          expect(fb[i]!.path.at(t - f.start)).toEqual(f.path.at(t - f.start));
      });
      expect(b.swings.filter((w) => w.contact < before)).toEqual(
        a.swings.filter((w) => w.contact < before),
      );
    };
    for (const { setup, picks } of CASES) {
      const { scripts, decided } = play(setup, picks);
      same(scripts[0]!, scripts[1]!, decided.first!.at);
      if (decided.second) same(scripts[1]!, scripts[2]!, decided.second.at);
    }
  }, 30_000);
});
