import { describe, expect, it } from "vitest";
import { sampleTrack, type ActorSample } from "../../three/track";
import { CLIP_PACE } from "../../three/rig";
import { TOUCH_STRETCH, type Side, type TennisReturn } from "../referee";
import {
  ACTORS,
  BALL_RADIUS,
  CAMERA,
  FACE,
  RECEIVE_SPOT,
  SERVE_SPOT,
  toWorld,
  type Vec3,
} from "./court";
import { TENNIS_3D_BEATS, WINDOW_MS, type Court } from "./match";
import {
  scriptPoint,
  type Decided,
  type Decision,
  type PointScript,
  type PointSetup,
} from "./rally";
import type { Reach } from "./reach";
import { pointShotlist, walkShotlist, type Shotlist } from "./sequence";
import {
  MISS,
  ROUTINE,
  SERVE_CLIP,
  SHUFFLE_PACE,
  STROKE_CLIP,
  SWING_LEAD,
  type TennisClip,
} from "./timing";

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
const window = (score: number, stretch: number) => ({
  serve: (WINDOW_MS.serve[score]! * stretch) / 1000,
  rally: (WINDOW_MS.rally[score]! * stretch) / 1000,
});
/** As rally.test.ts's FEW: every draw at once at each value, the shortest and longest windows, both routines. */
const SETUPS: PointSetup[] = COURTS.flatMap((court) =>
  SIDES.flatMap((o0) =>
    SIDES.flatMap((o1) =>
      [window(3, 1), window(0, TOUCH_STRETCH)].flatMap((windows) =>
        [0, 0.5, 0.999].flatMap((v) =>
          [false, true].map((first) => ({
            court,
            first,
            capped: false,
            gamePoint: false,
            windows,
            open: [o0, o1] as [Side, Side],
            draws: Array<number>(6).fill(v),
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
  const decisions: Decision[] = [];
  for (const [i, r] of inputs.entries()) {
    const d = decision(r, scripts[i]!.windows[i]!);
    decisions.push(d);
    if (i === 0) decided.first = d;
    else decided.second = d;
    scripts.push(scriptPoint(s, { ...decided }, REACH));
  }
  return { scripts, decisions, script: scripts[scripts.length - 1]! };
}
/** Every point of the sweep, capped and not, played to the end. */
const POINTS = SETUPS.flatMap((base) =>
  [false, true].flatMap((capped) =>
    SEQUENCES.map((inputs) => ({ inputs, ...play({ ...base, capped }, inputs) })),
  ),
);

const FRAME = 1 / 60;
const gap = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const ground = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const turnOf = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a)));
const top = <C extends string>(s: ActorSample<C>) =>
  s.clips.reduce((a, b) => (b.weight > a.weight ? b : a));
const frames = (from: number, to: number) =>
  Array.from({ length: Math.floor((to - from) / FRAME) + 1 }, (_, k) => from + k * FRAME);

describe("pointShotlist: the ball", () => {
  it("the routine bounces, the hold, the toss to the serve contact, the flights, then nothing", () => {
    for (const { script } of POINTS.slice(0, 40)) {
      const s = pointShotlist(script, REACH);
      const spot = SERVE_SPOT[script.setup.court];
      const hand = toWorld(spot, FACE.yash, REACH.bounce);
      const bounces = script.serveClipAt / ROUTINE.period;
      for (let k = 0; k < bounces; k++) {
        const t0 = k * ROUTINE.period;
        // Each bounce leaves the hand (the palm, a few cm past the wrist) and meets the floor under it.
        expect(gap(s.ball(t0)!, hand)).toBeLessThan(0.1);
        expect(s.ball(t0 + ROUTINE.period / 2)![1]).toBeCloseTo(BALL_RADIUS, 6);
      }
      for (const t of frames(0, script.serveClipAt - 1e-6)) {
        const b = s.ball(t)!;
        expect(ground(b, hand)).toBeLessThan(0.1);
        expect(b[1]).toBeGreaterThanOrEqual(BALL_RADIUS - 1e-9);
        expect(b[1]).toBeLessThan(hand[1] + 0.1);
        expect(s.held(t)).toBeNull();
      }
      for (const t of frames(script.serveClipAt, script.tossAt - 1e-6))
        expect(s.held(t)).toBe("yash");
      expect(s.held(script.tossAt)).toBeNull();
      expect(gap(s.ball(script.tossAt)!, toWorld(spot, FACE.yash, REACH.toss))).toBeLessThan(0.1);
      expect(s.ball((script.tossAt + script.serveAt) / 2)![1]).toBeGreaterThan(REACH.serve[1]);
      expect(gap(s.ball(script.serveAt)!, toWorld(spot, FACE.yash, REACH.serve))).toBeLessThan(
        1e-6,
      );
      for (const t of frames(script.serveAt, s.end)) {
        const f = script.flights.filter((f) => f.start <= t).at(-1)!;
        expect(s.ball(t)).toEqual(f.path.at(t - f.start));
      }
      expect(s.ball(s.end + 0.01)).toBeNull();
    }
  });
});

describe("pointShotlist: the players", () => {
  it("every swing that meets the ball is at its contact frame when the ball arrives", () => {
    for (const { script } of POINTS) {
      const s = pointShotlist(script, REACH);
      for (const w of script.swings.filter((w) => w.meets)) {
        const now = top(sampleTrack(s.actors[w.by], w.contact));
        expect(now.clip).toBe(w.kind);
        const at = w.kind === "serve" ? SERVE_CLIP.contact : STROKE_CLIP.contact;
        expect(Math.abs(now.time - at)).toBeLessThan(FRAME);
      }
    }
  });

  it("nothing snaps: weights sum to 1, small steps, gentle turns (every frame of every point and the walk after)", () => {
    const bad: string[] = [];
    for (const { script, inputs } of POINTS) {
      const s = pointShotlist(script, REACH);
      const next = {
        ...script.setup,
        court: (script.setup.court === "deuce" ? "ad" : "deuce") as Court,
      };
      for (const [n, list] of [s, walkShotlist(s, next), walkShotlist(s, null)].entries())
        for (const id of ACTORS) {
          let was = sampleTrack(list.actors[id], 0);
          for (const t of frames(0, list.end)) {
            const now = sampleTrack(list.actors[id], t);
            const sum = now.clips.reduce((sum, c) => sum + c.weight, 0);
            const step = ground(now.position, was.position);
            const turn = turnOf(was.face, now.face);
            if ((Math.abs(sum - 1) > 1e-9 || step >= 0.2 || turn >= 0.35) && bad.length < 10)
              bad.push(
                `${inputs.map((r) => r.call)} list ${n} ${id} t ${t.toFixed(3)}: sum ${sum} step ${step} turn ${turn}`,
              );
            was = now;
          }
        }
    }
    expect(bad).toEqual([]);
  }, 30_000);

  it("feet do not slide: a run or a shuffle at full weight plays at the ground speed", () => {
    const pace: Partial<Record<TennisClip, number>> = {
      jog: CLIP_PACE.jog,
      sprint: CLIP_PACE.sprint,
      walk: CLIP_PACE.walk,
      shuffleL: SHUFFLE_PACE,
      shuffleR: SHUFFLE_PACE,
    };
    let checked = 0;
    for (const { script } of POINTS) {
      const s = pointShotlist(script, REACH);
      const next = {
        ...script.setup,
        court: (script.setup.court === "deuce" ? "ad" : "deuce") as Court,
      };
      for (const list of [s, walkShotlist(s, next)])
        for (const id of ACTORS) {
          const track = list.actors[id];
          for (const t of frames(FRAME, list.end)) {
            const now = sampleTrack(track, t);
            const before = sampleTrack(track, t - 1e-4);
            const clip = now.clips[0]!;
            const p = pace[clip.clip];
            if (p === undefined || now.clips.length > 1 || before.clips.length > 1) continue;
            const speed = ground(now.position, before.position) / 1e-4;
            const seg = track.clips.filter((c) => c.start <= t).at(-1)!;
            expect(Math.abs((seg.speed ?? 1) * p - speed)).toBeLessThanOrEqual(0.1 * speed + 1e-6);
            checked++;
          }
        }
    }
    expect(checked).toBeGreaterThan(0);
  }, 30_000);

  it("a late swing reaches the ball's place MISS.late after the ball; an early one up to MISS.early before", () => {
    let seen = 0;
    for (const { script, scripts, inputs } of POINTS) {
      const s = pointShotlist(script, REACH);
      for (const w of script.swings.filter((w) => w.miss)) {
        const clipAt = (t: number) =>
          sampleTrack(s.actors.you, t).clips.find((c) => c.clip === w.kind)!.time;
        expect(clipAt(w.contact)).toBeCloseTo(STROKE_CLIP.contact, 9);
        if (w.miss === "late")
          expect(clipAt(w.contact - MISS.late)).toBeLessThanOrEqual(
            STROKE_CLIP.contact - SWING_LEAD + 1e-9,
          );
        else {
          // The ball's moment is the provisional swing's (before the input was judged).
          const ball = scripts[inputs.length - 1]!.swings.filter((x) => x.by === "you").at(-1)!;
          expect(ball.contact - w.contact).toBeGreaterThan(0.03 - 1e-9);
          expect(ball.contact - w.contact).toBeLessThanOrEqual(MISS.early + 1e-9);
        }
        seen++;
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("you always reach the ball, a miss or a net shot included: your feet end within reach of its place, and the last step is toward it", () => {
    const bad: string[] = [];
    const kinds = new Set<string>();
    for (const { script, scripts, inputs } of POINTS) {
      const s = pointShotlist(script, REACH);
      for (const w of script.swings.filter((w) => w.by === "you" && w.kind !== "stretch")) {
        // The ball's moment at your racket: the swing's own, or (a miss) the one planned before the input was judged.
        const planned =
          w.miss === "late"
            ? w.contact - MISS.late
            : w.miss === "early"
              ? scripts[inputs.length - 1]!.swings.filter((x) => x.by === "you").at(-1)!.contact
              : w.contact;
        const f = script.flights.filter((f) => f.start < planned - 1e-9).at(-1)!;
        const ball = f.path.at(planned - f.start);
        const reach = Math.hypot(REACH[w.kind as "forehand"][0], REACH[w.kind as "forehand"][2]);
        const pos = (t: number) => sampleTrack(s.actors.you, t).position;
        const why = (m: string) =>
          bad.length < 10 && bad.push(`${inputs.map((r) => r.call)} ${w.miss ?? "hit"}: ${m}`);
        if (ground(pos(w.contact), ball) > reach + 0.15)
          why(`${ground(pos(w.contact), ball)} m from the ball, reach ${reach}`);
        // The feet that put the sweet spot on the ball: he is on them at the swing, and his last step went toward them.
        if (ground(pos(w.contact), w.spot) > 0.01) why("he is not on his spot at the swing");
        if (ground(pos(w.contact), w.spot) > ground(pos(w.contact - 0.4), w.spot) + 1e-6)
          why("his last step is away from the ball");
        kinds.add(`${w.miss ?? "hit"} ${script.setup.capped}`);
      }
    }
    expect(bad).toEqual([]);
    expect([...kinds].sort()).toEqual(
      ["early false", "early true", "hit false", "hit true", "late false", "late true"].sort(),
    );
  }, 30_000);
});

describe("pointShotlist: the rebuild and the cues", () => {
  it("a rebuild never changes the past: the ball, the players, the camera, the glow", () => {
    const bad: string[] = [];
    const off = (a: Vec3 | null, b: Vec3 | null) =>
      a === null || b === null ? a !== b : gap(a, b) > 1e-9;
    for (const { scripts, decisions, inputs } of POINTS) {
      decisions.forEach((d, i) => {
        const before = pointShotlist(scripts[i]!, REACH);
        const after = pointShotlist(scripts[i + 1]!, REACH);
        for (const t of frames(0, d.at - 1e-6)) {
          const why: string[] = [];
          if (off(after.ball(t), before.ball(t))) why.push("ball");
          if (after.held(t) !== before.held(t)) why.push("held");
          if (JSON.stringify(after.glow(t)) !== JSON.stringify(before.glow(t))) why.push("glow");
          if (off(after.camera(t).target, before.camera(t).target)) why.push("camera");
          for (const id of ACTORS) {
            const [a, b] = [sampleTrack(before.actors[id], t), sampleTrack(after.actors[id], t)];
            const same =
              !off(a.position, b.position) &&
              Math.abs(a.face - b.face) < 1e-9 &&
              a.clips.length === b.clips.length &&
              a.clips.every((c, k) => {
                const e = b.clips[k]!;
                return (
                  c.clip === e.clip &&
                  Math.abs(c.time - e.time) < 1e-9 &&
                  Math.abs(c.weight - e.weight) < 1e-9
                );
              });
            if (!same) why.push(id);
          }
          if (why.length > 0 && bad.length < 10)
            bad.push(
              `${inputs.map((r) => r.call)} input ${i} at ${t.toFixed(3)}: ${why.join(", ")}`,
            );
        }
      });
    }
    expect(bad).toEqual([]);
  }, 30_000);

  it("cues: a hit at each contact, the court at each bounce, ooh at an OUT, applause unless it is GAME", () => {
    const at = (s: Shotlist, sound: string) =>
      s.cues.filter((c) => c.sound === sound).map((c) => c.at);
    for (const { script } of POINTS) {
      const s = pointShotlist(script, REACH);
      const end = script.end!;
      expect(at(s, "hit")).toEqual(script.swings.filter((w) => w.meets).map((w) => w.contact));
      const flights = script.flights.flatMap((f, i) => {
        const until = Math.min(script.flights[i + 1]?.start ?? Infinity, end);
        return f.path.bounces.map((b) => f.start + b).filter((b) => b < until);
      });
      const routine = Array.from(
        { length: script.serveClipAt / ROUTINE.period },
        (_, k) => (k + 0.5) * ROUTINE.period,
      );
      expect(at(s, "court")).toEqual([...routine, ...flights]);
      expect(at(s, "ooh")).toEqual(script.mark ? [script.mark.from] : []);
      expect(at(s, "applause")).toEqual([end - 0.3]);
      expect(s.buzz).toEqual(script.contacts);
    }
  });

  it("at 40, no applause when Yash wins the point (GAME), applause when you win it", () => {
    const base = { ...SETUPS[0]!, gamePoint: true };
    const applause = (inputs: TennisReturn[]) => {
      const { script } = play(base, inputs);
      return pointShotlist(script, REACH).cues.filter((c) => c.sound === "applause");
    };
    for (const inputs of [[late], [early], [wrong], [good, late], [perfect, wrong]])
      expect(applause(inputs)).toEqual([]);
    expect(applause([good, good])).toHaveLength(1);
  });
});

describe("walkShotlist", () => {
  it("both walk to the next point's places within the call, facing the walk, then the net", () => {
    const callS = TENNIS_3D_BEATS.callMs / 1000;
    for (const { script } of POINTS) {
      const after = pointShotlist(script, REACH);
      const next: PointSetup = {
        ...script.setup,
        court: script.setup.court === "deuce" ? "ad" : "deuce",
      };
      const s = walkShotlist(after, next);
      const to = { yash: SERVE_SPOT[next.court], you: RECEIVE_SPOT[next.court] };
      for (const id of ACTORS) {
        const from = sampleTrack(after.actors[id], after.end).position;
        const there = sampleTrack(s.actors[id], callS);
        expect(gap(there.position, to[id])).toBeLessThan(1e-9);
        expect(turnOf(there.face, FACE[id])).toBeLessThan(1e-9);
        if (ground(from, to[id]) < 0.5) continue;
        const mid = sampleTrack(s.actors[id], s.actors[id].moves[0]!.end / 2);
        const heading = Math.atan2(to[id][0] - from[0], to[id][2] - from[2]);
        expect(turnOf(mid.face, heading)).toBeLessThan(1e-6);
        expect(["walk", "jog"]).toContain(top(mid).clip);
      }
    }
  });

  it("at GAME, Yash pumps his fist and the camera pushes in toward CAMERA.game", () => {
    const after = pointShotlist(POINTS[0]!.script, REACH);
    const s = walkShotlist(after, null);
    expect(s.actors.yash.clips.map((c) => c.clip)).toContain("fistPump");
    const toGame = (t: number) => gap(s.camera(t).position, CAMERA.game.position);
    expect(toGame(s.end)).toBeLessThan(toGame(0) / 2);
  });
});
