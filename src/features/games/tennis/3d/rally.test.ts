import { describe, expect, it } from "vitest";
import { TOUCH_STRETCH, type Side, type TennisReturn } from "../referee";
import { NET_CLEAR, type BallPath } from "./ball";
import {
  BALL_RADIUS,
  BOX,
  COURT,
  FACE,
  feetFor,
  netHeightAt,
  RECEIVE_SPOT,
  SERVE_SPOT,
  toWorld,
  type Vec3,
} from "./court";
import { decidePoint, MATCH_START, WINDOW_MS, type Court } from "./match";
import {
  OUT_BY,
  scriptPoint,
  type Decided,
  type Decision,
  type PointScript,
  type PointSetup,
  type Swing,
} from "./rally";
import type { Reach } from "./reach";
import { STROKE_CLIP, SWING_LEAD } from "./timing";

/** The reach Task 5 measured on the real athlete (body frame: x its left, y up, z its front). */
const REACH: Reach = {
  serve: [-0.108, 2.678, 0.515],
  forehand: [-0.855, 0.898, 0.543],
  backhand: [0.655, 0.938, 0.537],
  toss: [-0.034, 1.851, 0.366],
  bounce: [0.022, 0.906, 0.421],
};

const SIDES: readonly Side[] = ["left", "right"];
const COURTS: readonly Court[] = ["deuce", "ad"];
/** Every window the game can have (s): desktop and column, at each of Yash's scores. */
const WINDOWS = [1, TOUCH_STRETCH].flatMap((stretch) =>
  WINDOW_MS.serve.map((serve, i) => ({
    serve: (serve * stretch) / 1000,
    rally: (WINDOW_MS.rally[i]! * stretch) / 1000,
  })),
);
const VALUES = [0, 0.5, 0.999];
/** Every draw at 0, 0.5 and 0.999; the OUT's margin (draw 1) moves with the last shot's draw (draw 5). */
const DRAWS = VALUES.flatMap((d0) =>
  VALUES.flatMap((d2) =>
    VALUES.flatMap((d3) => VALUES.flatMap((d4) => VALUES.map((d5) => [d0, d5, d2, d3, d4, d5]))),
  ),
);

const setup = (
  court: Court,
  open: [Side, Side],
  windows: PointSetup["windows"],
  draws: number[],
): PointSetup => ({ court, first: false, capped: false, windows, open, draws });
/** Every setup the sweep covers (no luck: built directly). */
const SETUPS: PointSetup[] = COURTS.flatMap((court) =>
  SIDES.flatMap((o0) =>
    SIDES.flatMap((o1) =>
      WINDOWS.flatMap((windows) => DRAWS.map((draws) => setup(court, [o0, o1], windows, draws))),
    ),
  ),
);
/** A smaller sweep for the rules: every draw at once at each value, the longest and shortest windows, both routines. */
const FEW: PointSetup[] = COURTS.flatMap((court) =>
  SIDES.flatMap((o0) =>
    SIDES.flatMap((o1) =>
      [WINDOWS[3]!, WINDOWS[4]!].flatMap((windows) =>
        VALUES.flatMap((v) =>
          [false, true].map((first) => ({
            ...setup(court, [o0, o1], windows, Array<number>(6).fill(v)),
            first,
          })),
        ),
      ),
    ),
  ),
);

const late: TennisReturn = { q: "miss", call: "ace" };
const early: TennisReturn = { q: "miss", call: "early" };
const wrong: TennisReturn = { q: "miss", call: "wrong" };
const good: TennisReturn = { q: "good", call: "returned" };
const perfect: TennisReturn = { q: "perfect", call: "clean" };
const other = (s: Side): Side => (s === "left" ? "right" : "left");

/** An input as the screen would make it (too early: during the toss; late: when the window runs out). */
function decision(r: TennisReturn, w: PointScript["windows"][number]): Decision {
  const span = w.commits - w.opens;
  if (r.call === "early") return { r, side: w.open, at: w.opens - 0.1 };
  if (r.call === "ace") return { r, side: null, at: w.commits };
  if (r.call === "wrong") return { r, side: other(w.open), at: w.opens + span * 0.5 };
  return { r, side: w.open, at: w.opens + span * (r.q === "perfect" ? 0.2 : 0.7) };
}
/** Plays the inputs one by one, as the game does: the script is rebuilt once each input is judged. */
function play(s: PointSetup, inputs: TennisReturn[]) {
  const scripts: PointScript[] = [scriptPoint(s, {}, REACH)];
  const decided: Decided = {};
  if (inputs[0]) {
    decided.first = decision(inputs[0], scripts[0]!.windows[0]!);
    scripts.push(scriptPoint(s, { ...decided }, REACH));
  }
  if (inputs[1]) {
    decided.second = decision(inputs[1], scripts[1]!.windows[1]!);
    scripts.push(scriptPoint(s, { ...decided }, REACH));
  }
  return { scripts, decided, script: scripts[scripts.length - 1]! };
}
/** Every way a point can go. */
const SEQUENCES: TennisReturn[][] = [
  [late],
  [early],
  [wrong],
  [good, late],
  [good, early],
  [perfect, wrong],
  [good, good],
  [perfect, perfect],
  [good, perfect],
];

const gap = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const ground = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[2] - b[2]);
/** The flight arriving at `t` (started before it) and the one leaving at `t` (started exactly then). */
const arriving = (s: PointScript, t: number) => s.flights.filter((f) => f.start < t - 1e-9).at(-1);
const leaving = (s: PointScript, t: number) => s.flights.find((f) => Math.abs(f.start - t) < 1e-9);
/** Where a player stood before a swing: his last recovery's end, or his place at the point's start. */
function stood(s: PointScript, w: Swing): Vec3 {
  const r = s.recovers.filter((r) => r.by === w.by && r.start < w.contact).at(-1);
  return r ? r.to : w.by === "you" ? RECEIVE_SPOT[s.setup.court] : SERVE_SPOT[s.setup.court];
}
/** The centre's height over the tape where the ball crosses the net before its first bounce, or null if it does not. */
function clearance(path: BallPath): number | null {
  const t1 = path.bounces[0] ?? path.reach;
  const z0 = path.at(0)[2];
  if (Math.sign(path.at(t1)[2]) === Math.sign(z0)) return null;
  let [lo, hi] = [0, t1];
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    if (Math.sign(path.at(mid)[2]) === Math.sign(z0)) lo = mid;
    else hi = mid;
  }
  const [x, y] = path.at(lo);
  return y - netHeightAt(x);
}
const inSingles = (p: Vec3) => Math.abs(p[0]) < COURT.singles && Math.abs(p[2]) < COURT.half;

/** Runs `check` on the final script of every sequence for every setup, capped or not; returns the first failures. */
function sweep(
  setups: PointSetup[],
  sequences: TennisReturn[][],
  check: (s: PointScript) => string | null,
) {
  const bad: string[] = [];
  for (const base of setups)
    for (const capped of [false, true])
      for (const inputs of sequences) {
        const { script } = play({ ...base, capped }, inputs);
        const why = check(script);
        if (why && bad.length < 10)
          bad.push(`${JSON.stringify({ ...base, capped })} ${inputs.map((r) => r.call)}: ${why}`);
      }
  return bad;
}

describe("scriptPoint: the shots", () => {
  it("the serve is good: from Yash's racket, into the box, at your racket when your window closes plus the swing", () => {
    const bad = sweep(SETUPS, [[good]], (s) => {
      const court = s.setup.court;
      const serve = s.flights[0]!;
      if (serve.start !== s.serveAt) return "starts late";
      if (gap(serve.path.at(0), toWorld(SERVE_SPOT[court], FACE.yash, REACH.serve)) > 1e-3)
        return "not from Yash's racket";
      const [x, , z] = serve.path.bounce!;
      const box = BOX[court];
      if (x < box.x[0] + 0.1 || x > box.x[1] - 0.1 || z < box.z[0] + 0.1 || z > box.z[1] - 0.1)
        return `bounce ${x.toFixed(3)}, ${z.toFixed(3)} not in the box`;
      const you = s.swings.find((w) => w.by === "you")!;
      const contact = s.serveAt + s.setup.windows.serve + SWING_LEAD;
      if (Math.abs(you.contact - contact) > 1e-9) return "your contact is off the window";
      const racket = toWorld(you.spot, FACE.you, REACH[you.kind as "forehand"]);
      return gap(serve.path.at(contact - serve.start), racket) > 1e-3 ? "misses your racket" : null;
    });
    expect(bad).toEqual([]);
  });

  it("every contact is exact (the sweet spot on the ball), with the stroke nearer where the player stood", () => {
    const bad = sweep(SETUPS, SEQUENCES, (s) => {
      for (const w of s.swings) {
        if (!w.meets) continue;
        const racket = toWorld(w.spot, FACE[w.by], REACH[w.kind as "serve"]);
        const ball = [arriving(s, w.contact), leaving(s, w.contact)].filter((f) => f !== undefined);
        if (ball.length === 0) return `${w.by} ${w.kind} at ${w.contact} has no ball`;
        for (const f of ball) {
          const off = gap(f.path.at(w.contact - f.start), racket);
          if (off > 1e-3) return `${w.by} ${w.kind} at ${w.contact.toFixed(3)} is ${off} m off`;
        }
        if (w.kind === "serve") continue;
        const at = ball[0]!.path.at(w.contact - ball[0]!.start);
        const from = stood(s, w);
        const fore = ground(feetFor(at, FACE[w.by], REACH.forehand), from);
        const back = ground(feetFor(at, FACE[w.by], REACH.backhand), from);
        if ((w.kind === "forehand") !== fore <= back) return `${w.by} plays the far stroke`;
      }
      return null;
    });
    expect(bad).toEqual([]);
  });

  it("no impossible run: under 7.5 m/s between a player's spots, after the follow-through", () => {
    const follow = STROKE_CLIP.end - STROKE_CLIP.contact;
    let fastest = 0;
    const bad = sweep(SETUPS, SEQUENCES, (s) => {
      for (const by of ["yash", "you"] as const) {
        const mine = s.swings.filter((w) => w.by === by).sort((a, b) => a.contact - b.contact);
        for (let i = 1; i < mine.length; i++) {
          const time = mine[i]!.contact - mine[i - 1]!.contact - follow;
          const pace = ground(mine[i]!.spot, mine[i - 1]!.spot) / time;
          fastest = Math.max(fastest, pace);
          if (!(time > 0 && pace < 7.5)) return `${by} runs at ${pace.toFixed(2)} m/s`;
        }
      }
      return null;
    });
    expect(bad).toEqual([]);
    expect(fastest).toBeGreaterThan(0);
  });

  // Task 4's carry: shotTo itself enforces nothing, so every shot the script plans with it is checked here.
  it("every ball to a racket is a real tennis ball, and every ball over the net clears it", () => {
    const bad = sweep(SETUPS, SEQUENCES, (s) => {
      for (const [i, f] of s.flights.entries()) {
        const p = f.path;
        const lift = clearance(p);
        if (lift !== null && lift < NET_CLEAR) return `flight ${i} clears the tape by ${lift}`;
        // A shot to a racket (shotTo) bounces before it reaches its target; the others end at a bounce or the net.
        if (!(p.bounces[0]! < p.reach - 1e-9)) continue;
        const [from, to, bounce] = [p.at(0), p.at(p.reach), p.bounce!];
        if (lift === null) return `flight ${i} never crosses the net`;
        if (!(p.kv >= 0.5 && p.kv <= 0.9)) return `flight ${i} keeps kv ${p.kv}`;
        if (!inSingles(bounce) || Math.sign(bounce[2]) !== Math.sign(to[2]))
          return `flight ${i} bounces out at ${bounce.join(", ")}`;
        if (!(Math.min(from[2], to[2]) < bounce[2] && bounce[2] < Math.max(from[2], to[2])))
          return `flight ${i} bounces outside its path`;
      }
      return null;
    });
    expect(bad).toEqual([]);
  });
});

describe("scriptPoint: the rules", () => {
  it("shots per point match decidePoint, and the call waits for the input", () => {
    for (const base of FEW)
      for (const capped of [false, true])
        for (const inputs of SEQUENCES) {
          const { scripts, script } = play({ ...base, capped }, inputs);
          const state = capped
            ? { points: [0, 1].map(() => decidePoint(MATCH_START, [good, good])) }
            : MATCH_START;
          expect(script.flights.length).toBe(decidePoint(state, inputs).shots);
          expect(script.end).toEqual(expect.any(Number));
          scripts.slice(0, -1).forEach((pending) => expect(pending.end).toBeNull());
        }
  });

  it("the windows: the serve's opens at the serve; the rally's at Yash's rally hit", () => {
    for (const base of FEW) {
      const { scripts } = play(base, [good, good]);
      const [w0, w1] = scripts[2]!.windows;
      const s = scripts[0]!;
      expect(w0).toEqual({
        opens: s.serveAt,
        commits: s.serveAt + base.windows.serve,
        open: base.open[0],
      });
      const rallyHit = scripts[1]!.swings.filter((w) => w.by === "yash")[1]!.contact;
      expect(w1!.opens).toBeCloseTo(rallyHit, 9);
      expect(w1!.commits).toBeCloseTo(rallyHit + base.windows.rally, 9);
      expect(w1!.open).toBe(base.open[1]);
    }
  });

  it("your winner lands in on the side you picked; at 30 it lands just OUT, with the mark there", () => {
    for (const base of FEW)
      for (const capped of [false, true])
        for (const inputs of [
          [good, good],
          [perfect, perfect],
        ]) {
          const { script, decided } = play({ ...base, capped }, inputs);
          const last = script.flights.at(-1)!;
          const bounce = last.path.bounce!;
          expect(bounce[2]).toBeLessThan(0);
          if (!capped) {
            expect(inSingles(bounce)).toBe(true);
            expect(Math.sign(bounce[0])).toBe(decided.second!.side === "right" ? 1 : -1);
            expect(script.mark).toBeNull();
            continue;
          }
          const past = Math.max(
            Math.abs(bounce[0]) - BALL_RADIUS - COURT.singles,
            Math.abs(bounce[2]) - BALL_RADIUS - COURT.half,
          );
          expect(past).toBeGreaterThanOrEqual(OUT_BY.min - 1e-9);
          expect(past).toBeLessThanOrEqual(OUT_BY.max + 1e-9);
          expect(gap(script.mark!.at, bounce)).toBeLessThan(1e-9);
          expect(script.mark!.from).toBeCloseTo(last.start + last.path.bounces[0]!, 9);
        }
  });

  it("a rebuild never changes the past", () => {
    const same = (a: PointScript, b: PointScript, before: number) => {
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
    for (const base of FEW)
      for (const capped of [false, true])
        for (const inputs of SEQUENCES) {
          const { scripts, decided } = play({ ...base, capped }, inputs);
          same(scripts[0]!, scripts[1]!, decided.first!.at);
          if (decided.second) same(scripts[1]!, scripts[2]!, decided.second.at);
        }
  });
});
