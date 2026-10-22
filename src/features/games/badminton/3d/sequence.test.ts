import { describe, expect, it } from "vitest";
import type { Judged, PickCall } from "../../engine/pick";
import type { GameLayout, Luck, Quality } from "../../engine/types";
import { CLIP_PACE } from "../../three/rig";
import { sampleTrack, type ActorSample, type ClipSeg } from "../../three/track";
import { toWorld } from "../../three/geometry";
import { CAMERA, FACE, type Vec3 } from "./court";
import {
  BADMINTON_3D_BEATS,
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
  type Player,
} from "./match";
import type { Reach } from "./reach";
import {
  scriptRally,
  setupRally,
  type Decided,
  type Decision,
  type RallyScript,
  type RallySetup,
  type Window,
} from "./rally";
import {
  GLOW_RISE,
  rallyShotlist,
  readyShotlist,
  walkShotlist,
  type Shotlist,
  type Track,
} from "./sequence";
import { heading } from "./shuttle";
import {
  BLOCK_CLIP,
  DIVE_CLIP,
  DIVE_LANDS,
  JUMP_SMASH_CLIP,
  LIFT_CLIP,
  NET_CLIP,
  OVERHEAD_CLIP,
  SERVE_CLIP,
  SHUFFLE_PACE,
  SWING_LEAD,
  type BadmintonClip,
  type Stroke,
} from "./timing";

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
const PLAYERS: readonly Player[] = ["yash", "you"];
const CONTACT: Record<Stroke, number> = {
  serve: SERVE_CLIP.contact,
  overhead: OVERHEAD_CLIP.contact,
  jumpSmash: JUMP_SMASH_CLIP.contact,
  net: NET_CLIP.contact,
  lift: LIFT_CLIP.contact,
  block: BLOCK_CLIP.contact,
  dive: DIVE_CLIP.contact,
};

const P = (q: Quality, call: PickCall): Judged => ({ q, call });
const PICKS = [P("perfect", "perfect"), P("miss", "wrong"), P("miss", "late"), P("miss", "early")];
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
const constant =
  (v: number): Luck =>
  () =>
    v;
/** A small seeded generator (mulberry32), as rally.test.ts. */
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
/** A pick as the screen makes it (early: before Yash's hit; late: the window runs out). */
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
  expect(judge({ dir: pick.dir, atMs: (pick.at - w.opens) * 1000 }, w.open, span * 1000)).toEqual(
    j,
  );
  return { j, ...pick };
}
/** Plays the picks one by one, as the game does: the script is rebuilt once each pick is judged. */
function play(setup: RallySetup, picks: Judged[]) {
  const scripts: RallyScript[] = [scriptRally(setup, {}, REACH)];
  const decided: Decided = {};
  const decisions: Decision[] = [];
  for (const [i, j] of picks.entries()) {
    const d = decision(j, scripts[i]!.windows[i]!);
    decisions.push(d);
    if (i === 0) decided.first = d;
    else decided.second = d;
    scripts.push(scriptRally(setup, { ...decided }, REACH));
  }
  return { scripts, decisions, script: scripts.at(-1)! };
}
/** Every rally of the sweep, played to the end, with the match state after it and the next rally's setup. */
const RALLIES = reachable().flatMap((s) =>
  LAYOUTS.flatMap((layout) =>
    LUCKS.flatMap((luck) => {
      const setup = setupRally(s, layout, luck);
      return pathsOf(s).map((picks) => {
        const after = playRally(s, picks);
        const next = matchOver(after) ? null : setupRally(after, layout, luck);
        return { s, picks, after, next, ...play(setup, picks) };
      });
    }),
  ),
);
const name = (r: (typeof RALLIES)[number]) =>
  `${r.script.setup.kind} ${r.script.setup.server} ${r.picks.map((p) => p.call)}`;

const FRAME = 1 / 60;
const gap = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const ground = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const turnOf = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a)));
const angle = (a: Vec3, b: Vec3) =>
  Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
const top = <C extends string>(s: ActorSample<C>) =>
  s.clips.reduce((a, b) => (b.weight > a.weight ? b : a));
const frames = (from: number, to: number) =>
  Array.from({ length: Math.floor((to - from) / FRAME) + 1 }, (_, k) => from + k * FRAME);
const lists = (r: (typeof RALLIES)[number]) => {
  const s = rallyShotlist(r.script, REACH);
  return [s, walkShotlist(s, r.next), walkShotlist(s, null)];
};
const yashWins = (r: (typeof RALLIES)[number]) => r.after.rallies.at(-1)!.winner === "yash";

describe("rallyShotlist: the shuttle", () => {
  it("the shuttle is held, dropped onto the racket, then follows each flight", () => {
    const bad: string[] = [];
    const fail = (r: (typeof RALLIES)[number], why: string) => {
      if (bad.length < 10) bad.push(`${name(r)}: ${why}`);
    };
    for (const r of RALLIES) {
      const { script } = r;
      const s = rallyShotlist(script, REACH);
      const serve = script.swings[0]!;
      const drop = script.serveAt - (SERVE_CLIP.contact - SERVE_CLIP.drop);
      const server = script.setup.server;
      for (const t of frames(0, drop - 1e-6))
        if (s.held(t) !== server || s.shuttle(t) !== null) fail(r, `not in his hand at ${t}`);
      if (s.held(drop) !== null) fail(r, "still held at the drop");
      if (gap(s.shuttle(drop)!.at, toWorld(serve.spot, serve.face, REACH.hold)) > 1e-6)
        fail(r, "it leaves from somewhere other than the hand");
      // It falls freely: from rest, cork down, onto the serve's sweet spot at its contact.
      if (gap(s.shuttle(drop + 0.01)!.at, s.shuttle(drop)!.at) > 0.01)
        fail(r, "thrown, not let go");
      if (gap(s.shuttle(script.serveAt)!.at, toWorld(serve.spot, serve.face, REACH.serve)) > 1e-6)
        fail(r, "it misses the serve's sweet spot");
      for (const t of frames(script.serveAt, s.end)) {
        const i = script.flights.findLastIndex((f) => f.start <= t);
        const f = script.flights[i]!;
        if (gap(s.shuttle(t)!.at, f.path.at(t - f.start)) > 1e-9) fail(r, `off its flight at ${t}`);
        if (s.held(t) !== null) fail(r, `held at ${t}`);
      }
      // Cork first: it turns over at each hit (fast, TURNOVER), never snaps.
      for (const t of frames(drop, s.end - FRAME)) {
        const a = s.shuttle(t)!.heading;
        if (Math.abs(Math.hypot(...a) - 1) > 1e-9) fail(r, "the heading is not a direction");
        if (angle(a, s.shuttle(t + 1e-4)!.heading) > 0.05) fail(r, `the cork snaps at ${t}`);
      }
      for (const [i, f] of script.flights.entries()) {
        const t = f.start + 0.2;
        if (t < s.end && angle(s.shuttle(t)!.heading, heading(null, f.path, 0.2)) > 1e-6)
          fail(r, `flight ${i} is not cork first`);
        const before = s.shuttle(f.start - 1e-6)!.heading;
        if (angle(before, s.shuttle(f.start)!.heading) > 0.01) fail(r, `flight ${i} jumps`);
      }
      if (s.shuttle(s.end + 0.01) !== null) fail(r, "still there after the end");
      // The racket meets it: at each contact the striker stands on his spot, faces his way, in his stroke's contact pose.
      for (const w of script.swings.filter((w) => w.meets)) {
        const now = sampleTrack(s.actors[w.by], w.contact);
        const pose = top(now);
        if (gap(now.position, w.spot) > 1e-6) fail(r, `${w.by} ${w.kind} is off his spot`);
        if (turnOf(now.face, w.face) > 1e-6) fail(r, `${w.by} ${w.kind} faces the wrong way`);
        if (pose.clip !== w.kind || pose.weight < 1 - 1e-9)
          fail(r, `${w.by} ${w.kind} at ${w.contact} plays ${pose.clip} at ${pose.weight}`);
        if (Math.abs(pose.time - CONTACT[w.kind as Stroke]) > 1e-6)
          fail(r, `${w.by} ${w.kind} is ${pose.time} into his stroke`);
      }
    }
    expect(bad).toEqual([]);
  }, 30_000);
});

describe("rallyShotlist: the players", () => {
  it("no clip snaps: every clip change has a fade of at least 0.05 s", () => {
    const bad: string[] = [];
    const clipTime = (c: ClipSeg<BadmintonClip>, t: number) =>
      (c.from ?? 0) + (t - c.start) * (c.speed ?? 1);
    for (const r of RALLIES)
      for (const [n, list] of lists(r).entries())
        for (const id of PLAYERS) {
          const track: Track = list.actors[id];
          const why = (w: string) =>
            bad.length < 10 && bad.push(`${name(r)} list ${n} ${id}: ${w}`);
          track.clips.forEach((c, k) => {
            const was = track.clips[k - 1];
            if (!was) return;
            // The first clip plays at full weight from the start: only a later one's fade counts.
            if (k > 1 && c.start < was.start + (was.fade ?? 0.15) - 1e-9)
              why(`${c.clip} at ${c.start} cuts in on ${was.clip}'s fade`);
            if (c.clip !== was.clip) {
              if ((c.fade ?? 0.15) < 0.05) why(`${was.clip} snaps to ${c.clip} at ${c.start}`);
            } else if (Math.abs(clipTime(was, c.start) - (c.from ?? 0)) > 1e-9)
              why(`${c.clip} jumps in time at ${c.start}`);
          });
          // No teleports, no snapping turns: every frame of the rally and the walk after it.
          let was = sampleTrack(track, 0);
          for (const t of frames(0, list.end)) {
            const now = sampleTrack(track, t);
            const sum = now.clips.reduce((sum, c) => sum + c.weight, 0);
            const step = ground(now.position, was.position);
            const turn = turnOf(was.face, now.face);
            // The walk's last turn to the net is the shared walkBack's (WALK.settle), bounded as tennis bounds it.
            if (Math.abs(sum - 1) > 1e-9 || step >= 0.1 || turn >= (n === 0 ? 0.25 : 0.35))
              why(`t ${t.toFixed(3)}: sum ${sum} step ${step} turn ${turn}`);
            was = now;
          }
        }
    expect(bad).toEqual([]);
  }, 30_000);

  it("no foot slides: a run's clip speed matches its ground speed (shuffle, jog or sprint pace)", () => {
    const pace: Partial<Record<BadmintonClip, number>> = {
      jog: CLIP_PACE.jog,
      sprint: CLIP_PACE.sprint,
      walk: CLIP_PACE.walk,
      shuffleL: SHUFFLE_PACE,
      shuffleR: SHUFFLE_PACE,
    };
    const bad: string[] = [];
    let checked = 0;
    for (const r of RALLIES)
      for (const list of lists(r).slice(0, 2))
        for (const id of PLAYERS) {
          const track = list.actors[id];
          for (const t of frames(FRAME, list.end)) {
            const now = sampleTrack(track, t);
            const before = sampleTrack(track, t - 1e-4);
            const p = pace[now.clips[0]!.clip];
            if (p === undefined || now.clips.length > 1 || before.clips.length > 1) continue;
            const speed = ground(now.position, before.position) / 1e-4;
            const seg = track.clips.filter((c) => c.start <= t).at(-1)!;
            const clipSpeed = (seg.speed ?? 1) * p;
            if (Math.abs(clipSpeed - speed) > 0.1 * speed + 1e-6 && bad.length < 10)
              bad.push(`${name(r)} ${id} ${seg.clip} at ${t}: feet ${clipSpeed}, ground ${speed}`);
            // R15: a run never plays slower than 0.42, a walk or a shuffle than half its pace (a shuffle trimming the
            // last few cm of a recovery cut short is let off: its clip still needs its fade).
            const k = track.clips.indexOf(seg);
            const until = track.clips[k + 1]?.start ?? list.end;
            const trim = ground(
              sampleTrack(track, seg.start).position,
              sampleTrack(track, until).position,
            );
            const floor =
              p === SHUFFLE_PACE ? (trim < 0.25 ? 0 : 0.5) : seg.clip === "walk" ? 0.5 : 0.42;
            if ((seg.speed ?? 1) < floor - 1e-9 && bad.length < 10)
              bad.push(`${name(r)} ${id} ${seg.clip} at ${seg.start} plays at ${seg.speed}`);
            checked++;
          }
        }
    // A stroke stands still: from the run's arrival (the stroke at full weight) to its contact, the feet do not move.
    let strokes = 0;
    for (const r of RALLIES) {
      const s = rallyShotlist(r.script, REACH);
      for (const w of r.script.swings.filter((w) => w.meets)) {
        const track = s.actors[w.by];
        for (const t of frames(w.contact - 1, w.contact)) {
          const now = sampleTrack(track, t);
          const before = sampleTrack(track, t - 1e-4);
          if (now.clips.length > 1 || now.clips[0]!.clip !== w.kind || before.clips.length > 1)
            continue;
          const speed = ground(now.position, before.position) / 1e-4;
          if (speed > 0.2 && bad.length < 10)
            bad.push(`${name(r)} ${w.by} ${w.kind} slides at ${speed} m/s at ${t}`);
          strokes++;
        }
      }
    }
    expect(bad).toEqual([]);
    expect(checked).toBeGreaterThan(0);
    expect(strokes).toBeGreaterThan(0);
  }, 30_000);

  it("the dive's player stays down until DIVE_CLIP.up, then ready", () => {
    let dives = 0;
    const bad: string[] = [];
    for (const r of RALLIES) {
      const dive = r.script.swings.find((w) => w.kind === "dive");
      if (!dive) continue;
      dives++;
      const track = rallyShotlist(r.script, REACH).actors.yash;
      const from = dive.contact - DIVE_CLIP.contact;
      const landing = toWorld(dive.spot, dive.face, DIVE_LANDS);
      const why = (w: string) => bad.length < 10 && bad.push(`${name(r)}: ${w}`);
      for (const t of frames(from + DIVE_CLIP.launch + 1e-6, from + DIVE_CLIP.up)) {
        const now = sampleTrack(track, t);
        if (now.clips.length !== 1 || now.clips[0]!.clip !== "dive") why(`not diving at ${t}`);
        if (gap(now.position, dive.spot) > 1e-9) why(`the body slides at ${t}`);
        if (turnOf(now.face, dive.face) > 1e-9) why(`not turned toward the shuttle at ${t}`);
      }
      // Getting up: as the dive hands over to ready, he is moved by the slide, so the body stays where it is.
      for (const t of frames(from + DIVE_CLIP.up, from + DIVE_CLIP.end)) {
        const now = sampleTrack(track, t);
        const ready = now.clips.find((c) => c.clip === "ready")?.weight ?? 0;
        const was = now.clips.find((c) => c.clip === "dive")?.weight ?? 0;
        if (Math.abs(ready + was - 1) > 1e-9) why(`something else plays at ${t}`);
        const at = [0, 1, 2].map((k) => dive.spot[k]! + (landing[k]! - dive.spot[k]!) * ready);
        if (gap(now.position, at as unknown as Vec3) > 1e-9) why(`he slides back at ${t}`);
      }
      const up = sampleTrack(track, from + DIVE_CLIP.end);
      if (top(up).clip !== "ready" || gap(up.position, landing) > 1e-9)
        why("not up and ready where the slide left him");
    }
    expect(bad).toEqual([]);
    expect(dives).toBeGreaterThan(0);
  }, 30_000);
});

describe("rallyShotlist: the cues and the glow", () => {
  it("the cues: shuttle at every contact, ooh at the mark, applause before every end but the last", () => {
    const at = (s: Shotlist, sound: string) =>
      s.cues.filter((c) => c.sound === sound).map((c) => c.at);
    for (const r of RALLIES) {
      const { script } = r;
      const s = rallyShotlist(script, REACH);
      const end = script.end!;
      expect(at(s, "shuttle")).toEqual(script.contacts);
      expect(at(s, "ooh")).toEqual(script.mark ? [script.mark.from] : []);
      expect(at(s, "applause")).toEqual(matchOver(r.after) ? [] : [end - 0.3]);
      expect(s.buzz).toEqual(
        script.swings.filter((w) => w.by === "you" && w.meets).map((w) => w.contact),
      );
      const squeaks = at(s, "squeak");
      squeaks.forEach((t, k) => k > 0 && expect(t - squeaks[k - 1]!).toBeGreaterThanOrEqual(0.3));
      for (const w of script.swings.filter((w) => w.kind === "dive")) {
        const lands = w.contact - DIVE_CLIP.contact + DIVE_CLIP.floor;
        expect(squeaks.some((t) => t <= lands + 1e-9 && t > lands - 0.3)).toBe(true);
      }
      expect(s.cues.map((c) => c.at)).toEqual([...s.cues.map((c) => c.at)].sort((a, b) => a - b));
    }
    // Every game's end is in the sweep, and only Yash ends it.
    expect(RALLIES.some((r) => matchOver(r.after))).toBe(true);
    RALLIES.filter((r) => matchOver(r.after)).forEach((r) => expect(yashWins(r)).toBe(true));
  }, 30_000);

  it("the glow lights the open part while a window is open", () => {
    for (const r of RALLIES.slice(0, 200)) {
      const { script } = r;
      const s = rallyShotlist(script, REACH);
      for (const t of frames(0, s.end)) {
        const w = script.windows.find((w) => t >= w.opens && t < w.commits + SWING_LEAD);
        const g = s.glow(t);
        if (!w) expect(g).toBeNull();
        else {
          expect(g!.part).toBe(w.open);
          expect(g!.strength).toBeCloseTo(Math.min(1, (t - w.opens) / GLOW_RISE), 9);
        }
      }
    }
  });
});

describe("walkShotlist", () => {
  it("walkShotlist: both are at the next rally's places by the end of the call", () => {
    const callS = BADMINTON_3D_BEATS.callMs / 1000;
    for (const r of RALLIES) {
      const after = rallyShotlist(r.script, REACH);
      if (!r.next) {
        // GAME: Yash pumps his fist and the camera pushes in toward CAMERA.game.
        const s = walkShotlist(after, null);
        expect(s.actors.yash.clips.map((c) => c.clip)).toContain("fistPump");
        const toGame = (t: number) => gap(s.camera(t).position, CAMERA.game.position);
        expect(toGame(s.end)).toBeLessThan(toGame(0) / 2);
        continue;
      }
      const s = walkShotlist(after, r.next);
      expect(s.end).toBeCloseTo(callS, 9);
      const ready = readyShotlist(r.next);
      const next = rallyShotlist(scriptRally(r.next, {}, REACH), REACH);
      for (const id of PLAYERS) {
        // The walk starts where the rally left him.
        expect(
          gap(
            sampleTrack(s.actors[id], 0).position,
            sampleTrack(after.actors[id], after.end).position,
          ),
        ).toBeLessThan(1e-9);
        const there = sampleTrack(s.actors[id], callS);
        expect(gap(there.position, ready.actors[id].home)).toBeLessThan(1e-9);
        expect(gap(there.position, sampleTrack(next.actors[id], 0).position)).toBeLessThan(1e-9);
        expect(turnOf(there.face, FACE[id])).toBeLessThan(1e-9);
        expect(top(there).clip).toBe("ready");
      }
      expect(s.held(callS)).toBe(r.next.server);
      expect(next.held(0)).toBe(r.next.server);
      expect(gap(s.camera(callS).target, next.camera(0).target)).toBeLessThan(1e-9);
    }
  }, 30_000);
});

describe("rallyShotlist: the rebuild", () => {
  it("a rebuild never changes the past", () => {
    const bad: string[] = [];
    const off = (a: Vec3 | undefined, b: Vec3 | undefined) =>
      a === undefined || b === undefined ? a !== b : gap(a, b) > 1e-9;
    for (const r of RALLIES) {
      r.decisions.forEach((d, i) => {
        const before = rallyShotlist(r.scripts[i]!, REACH);
        const after = rallyShotlist(r.scripts[i + 1]!, REACH);
        const past = (c: { at: number }[]) => JSON.stringify(c.filter((c) => c.at < d.at));
        const why: string[] = [];
        if (past(after.cues) !== past(before.cues)) why.push("cues");
        if (past(after.buzz.map((at) => ({ at }))) !== past(before.buzz.map((at) => ({ at }))))
          why.push("buzz");
        for (const t of frames(0, d.at - 1e-6)) {
          if (off(after.shuttle(t)?.at, before.shuttle(t)?.at)) why.push(`shuttle ${t}`);
          if (off(after.shuttle(t)?.heading, before.shuttle(t)?.heading)) why.push(`cork ${t}`);
          if (after.held(t) !== before.held(t)) why.push(`held ${t}`);
          if (JSON.stringify(after.glow(t)) !== JSON.stringify(before.glow(t)))
            why.push(`glow ${t}`);
          if (off(after.camera(t).target, before.camera(t).target)) why.push(`camera ${t}`);
          for (const id of PLAYERS) {
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
            if (!same) why.push(`${id} ${t.toFixed(3)}`);
          }
        }
        if (why.length > 0 && bad.length < 10)
          bad.push(`${name(r)} pick ${i}: ${why.slice(0, 4).join(", ")}`);
      });
    }
    expect(bad).toEqual([]);
  }, 30_000);
});
