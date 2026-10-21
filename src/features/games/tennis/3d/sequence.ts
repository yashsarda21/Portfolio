import { CLIP_PACE } from "../../three/rig";
import { lerp3, sampleTrack, type ActorTrack, type ClipSeg } from "../../three/track";
import { TOUCH_STRETCH, type Side } from "../referee";
import {
  ACTORS,
  BALL_RADIUS,
  CAMERA,
  FACE,
  GRAVITY,
  RECEIVE_SPOT,
  SERVE_SPOT,
  sideSign,
  toWorld,
  type ActorId,
  type CameraPose,
  type Vec3,
} from "./court";
import { TENNIS_3D_BEATS, WINDOW_MS } from "./match";
import { RECOVER, type PointScript, type PointSetup, type Recover, type Swing } from "./rally";
// Type only: reach.ts imports three, and this file is reached from the first load (ruling R3).
import type { Reach } from "./reach";
import {
  FIST_PUMP_CLIP,
  MISS,
  ROUTINE,
  SERVE_CLIP,
  SERVE_LANDS,
  SHUFFLE_PACE,
  SPLIT_CLIP,
  STRETCH_CLIP,
  STROKE_CLIP,
  SWING_LEAD,
  type TennisClip,
} from "./timing";

export type Track = ActorTrack<TennisClip>;
export type Sound = "hit" | "court" | "applause" | "ooh";
export interface Cue {
  at: number;
  sound: Sound;
}
/** Everything on the court as a function of time (s from its start). */
export interface Shotlist {
  end: number;
  ball(t: number): Vec3 | null;
  /** Who holds the ball in his left hand at `t` (the scene puts it at that hand), or null. */
  held(t: number): ActorId | null;
  actors: Record<ActorId, Track>;
  camera(t: number): CameraPose;
  /** The open side's glow on Yash's half while a window is open: its side and strength (0 to 1). */
  glow(t: number): { side: Side; strength: number } | null;
  mark: { at: Vec3; from: number } | null;
  cues: Cue[];
  /** When your racket meets the ball: the phone buzzes. */
  buzz: number[];
}

/** A player sets off this long after the other's hit: the split-step's push-off, blended into the run. */
export const RUN_AFTER = 0.1;
/**
 * The stroke takes over from the run over this long: the racket is prepared on the move, and the stroke has its full
 * weight as the feet stop, at the forward swing's start (the run arrives at contact − SWING_LEAD).
 */
export const STROKE_FADE = STROKE_CLIP.contact - SWING_LEAD;
/** A run this short or this slow is a side shuffle, facing the net; from `sprint` m/s it is a sprint, else a jog. */
export const FOOTWORK = { shuffleUnder: 1, shuffleSlower: 2.7, sprint: 4 } as const;
/**
 * A shuffle or a walk never plays slower than this (its clip speed): a short, slow one is done sooner, and he waits.
 * The runs (jog, sprint) are only chosen from FOOTWORK.shuffleSlower, so they play at 0.44 or more.
 */
export const SLOWEST_STEP = 0.5;
/** An early (missed) swing's run goes no faster than this (m/s): he stops short of the ball's line. */
export const EARLY_RUN_CAP = 6;
/** How long a player takes to turn toward a run, and back to the net as he arrives (s). */
export const TURN = { out: 0.15, back: 0.2 } as const;
/** The serve hands over to the recovery this long before its end, while he settles inside the line. */
export const SERVE_HANDOVER = 0.2;
/** The glow on the open side rises over this long. */
export const GLOW_RISE = 0.15;
/** The camera's pan follows the ball's x over the last 0.6 s: these many samples, this far apart. */
export const PAN = { samples: 5, every: 0.15 } as const;
/** Between points: past this far a player jogs back instead of walking; he is there this long before the call ends. */
export const WALK = { jogOver: 2.6, settle: 0.2, fade: 0.3 } as const;
/** At GAME the camera pushes in over this long. */
export const GAME_PUSH_S = 3;
/**
 * The palm, from the wrist bone that `Reach.toss` and `Reach.bounce` measure (body frame): the ball sits about 8 cm
 * along the hand, a little up and forward.
 */
const PALM: Vec3 = [0, 0.05, 0.06];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (f: number) => {
  const c = clamp01(f);
  return c * c * (3 - 2 * c);
};
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const ground = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const blend = (a: CameraPose, b: CameraPose, f: number): CameraPose => ({
  position: lerp3(a.position, b.position, f),
  target: lerp3(a.target, b.target, f),
});
const homeOf = (id: ActorId, setup: PointSetup): Vec3 =>
  id === "yash" ? SERVE_SPOT[setup.court] : RECEIVE_SPOT[setup.court];
/** What a player waits in: Yash bounces the ball, you stand ready. */
const waitClip = (id: ActorId): TennisClip => (id === "yash" ? "bounceBall" : "ready");
const PERIOD: Partial<Record<TennisClip, number>> = { bounceBall: ROUTINE.period, ready: 1.2 };

/** Adds a clip; any clip from its start on is dropped (a later plan replaces an earlier one). */
function addClip(track: Track, seg: ClipSeg<TennisClip>) {
  track.clips = track.clips.filter((c) => c.start < seg.start);
  track.clips.push(seg);
}
/** Stops whatever walk is under way at `t`, where it has got to (every move here is linear). */
function cut(track: Track, t: number) {
  const at = sampleTrack(track, t).position;
  track.moves = track.moves
    .filter((m) => m.start < t)
    .map((m) => (m.end > t ? { ...m, end: t, to: at } : m));
}

interface Leg {
  /** The footwork clip starts here (with `fade`); the move runs from `start` to `end`. */
  clipAt: number;
  start: number;
  end: number;
  to: Vec3;
  fade: number;
  /** A run turns back to the net from `backAt`, over `back` s. */
  backAt: number;
  back: number;
  /** A slow shuffle may be done early, if he can settle in ready (0.15 s) before this. */
  settleBy: number;
}
/**
 * A player gets from where he is to `leg.to`: a side shuffle (facing the net) when short or slow, else a jog or a
 * sprint facing the run. Each clip plays at the speed that keeps the feet still (ground speed / its pace). Returns when
 * he gets there (a slow shuffle is done before `leg.end`), or null when he is already there.
 */
function travel(track: Track, id: ActorId, leg: Leg): number | null {
  const from = sampleTrack(track, leg.start).position;
  const dx = leg.to[0] - from[0];
  const dz = leg.to[2] - from[2];
  const d = Math.hypot(dx, dz);
  if (d < 1e-3) return null;
  const v = d / (leg.end - leg.start);
  if (d < FOOTWORK.shuffleUnder || v < FOOTWORK.shuffleSlower) {
    // The player's left, in the world: x cos(face), z −sin(face).
    const left = dx * Math.cos(FACE[id]) - dz * Math.sin(FACE[id]) > 0;
    const clip = left ? "shuffleL" : "shuffleR";
    // Done early (not before its clip has faded in, so three clips never blend), if there is room to settle.
    const early = Math.max(leg.start + d / (SLOWEST_STEP * SHUFFLE_PACE), leg.clipAt + leg.fade);
    const slow = v < SLOWEST_STEP * SHUFFLE_PACE && early + 0.15 <= leg.settleBy;
    const end = slow ? early : leg.end;
    const pace = d / (end - leg.start);
    addClip(track, {
      clip,
      start: leg.clipAt,
      loop: true,
      speed: pace / SHUFFLE_PACE,
      fade: leg.fade,
    });
    track.moves.push({ start: leg.start, end, to: leg.to, face: FACE[id], turn: TURN.back });
    return end;
  }
  const clip = v < FOOTWORK.sprint ? "jog" : "sprint";
  addClip(track, {
    clip,
    start: leg.clipAt,
    loop: true,
    speed: v / CLIP_PACE[clip],
    fade: leg.fade,
  });
  const back = Math.min(Math.max(leg.backAt, leg.start), leg.end);
  track.moves.push(
    {
      start: leg.start,
      end: back,
      to: lerp3(from, leg.to, (back - leg.start) / (leg.end - leg.start)),
      face: Math.atan2(dx, dz),
      turn: TURN.out,
    },
    { start: back, end: leg.end, to: leg.to, face: FACE[id], turn: leg.back },
  );
  return leg.end;
}

/** A recovery (a shuffle or a run back toward the middle), then ready. */
function recover(track: Track, id: ActorId, r: Recover, clipAt = r.start, fade = 0.2) {
  const leg = {
    clipAt,
    start: r.start,
    end: r.end,
    to: r.to,
    fade,
    backAt: r.end,
    back: TURN.back,
    settleBy: Infinity,
  };
  const there = travel(track, id, leg) ?? clipAt;
  addClip(track, { clip: "ready", start: there, loop: true, fade });
}

/** The stretch toward the player's own right is the forehand lunge; `side` is the screen's (ruling R5). */
const stretchClip = (id: ActorId, side: Side): TennisClip =>
  // The player's right, in the world, has x −cos(face).
  sideSign(side) * -Math.cos(FACE[id]) > 0 ? "stretchF" : "stretchB";

/** One swing: the split-step at the other's hit, the run, the stroke on its contact (or a miss's), then ready. */
function swing(track: Track, id: ActorId, w: Swing, hit: number) {
  const go = hit + RUN_AFTER;
  const stretch = w.kind === "stretch";
  // A late swing keeps the meeting swing's timing up to its commit (the ball's moment − SWING_LEAD).
  const on = w.miss === "late" ? w.contact - MISS.late : w.contact;
  const clip: TennisClip = stretch ? stretchClip(id, w.side ?? "right") : (w.kind as TennisClip);
  const clipAt = stretch ? w.contact - STRETCH_CLIP.reach : on - STROKE_CLIP.contact;
  const fade = stretch ? STRETCH_CLIP.reach : STROKE_FADE;
  const arrive = stretch ? w.contact : on - SWING_LEAD;

  cut(track, go);
  addClip(track, { clip: "split", start: hit, fade: 0.1 });
  const from = sampleTrack(track, go).position;
  let to = w.spot;
  const far = ground(from, to);
  if (w.miss === "early" && far > EARLY_RUN_CAP * (arrive - go))
    to = lerp3(from, to, (EARLY_RUN_CAP * (arrive - go)) / far);
  const leg = {
    clipAt: go,
    start: go,
    end: arrive,
    to,
    fade: 0.15,
    backAt: clipAt,
    back: fade,
    settleBy: clipAt,
  };
  // Settled before the stroke (no run, or a short shuffle done early): ready until it.
  const there = clipAt - go >= TURN.out ? travel(track, id, leg) : null;
  const settled = there ?? hit + SPLIT_CLIP.end;
  if (clipAt > settled + 0.15)
    addClip(track, { clip: "ready", start: settled, loop: true, fade: 0.15 });

  addClip(track, { clip, start: clipAt, fade });
  if (w.miss === "late") {
    // Frozen at the commit while the ball goes by, then on: the racket reaches its place MISS.late after the ball.
    const commit = on - SWING_LEAD;
    addClip(track, { clip, start: commit, from: STROKE_CLIP.commit, speed: 0, fade: 0.05 });
    addClip(track, { clip, start: commit + MISS.late, from: STROKE_CLIP.commit, fade: 0.05 });
  }
  const done = stretch
    ? clipAt + STRETCH_CLIP.end
    : w.contact + STROKE_CLIP.end - STROKE_CLIP.contact;
  addClip(track, { clip: "ready", start: done, loop: true, fade: 0.3 });
}

/** One player's point: waiting, then each swing and recovery in turn. */
function playerTrack(id: ActorId, script: PointScript): Track {
  const home = homeOf(id, script.setup);
  const track: Track = { home, face: FACE[id], clips: [], moves: [] };
  addClip(track, { clip: waitClip(id), start: 0, loop: true });
  const mine = script.swings.filter((w) => w.by === id && w.kind !== "serve");
  const recs = script.recovers.filter((r) => r.by === id);
  if (id === "yash") {
    addClip(track, { clip: "serve", start: script.serveClipAt, fade: 0.15 });
    // The serve lands him inside the line (its hips carry him there); as it hands over he is moved there, so the body
    // stays put, then he recovers, taking RECOVER.takes from then.
    const hand = script.serveClipAt + SERVE_CLIP.end - SERVE_HANDOVER;
    track.moves.push({
      start: hand,
      end: hand + SERVE_HANDOVER,
      to: toWorld(home, FACE.yash, SERVE_LANDS),
    });
    const r = recs.find((r) => r.start < (mine[0]?.contact ?? Infinity));
    if (r) {
      const start = hand + SERVE_HANDOVER;
      recover(track, id, { ...r, start, end: start + RECOVER.takes }, hand, SERVE_HANDOVER);
    }
  }
  mine.forEach((w, i) => {
    const other = script.swings.filter((x) => x.by !== id && x.meets && x.contact < w.contact);
    swing(track, id, w, other.at(-1)!.contact);
    const next = mine[i + 1]?.contact ?? Infinity;
    const r = recs.find((r) => r.start > w.contact && r.start < next);
    if (r) recover(track, id, r);
  });
  return track;
}

/** Yash's bounces: each leaves his palm at a period's start, meets the court under it halfway, and is caught again. */
function routineBall(spot: Vec3, reach: Reach) {
  const hand = toWorld(spot, FACE.yash, add(reach.bounce, PALM));
  const half = ROUTINE.period / 2;
  const down = (hand[1] - BALL_RADIUS - (GRAVITY * half * half) / 2) / half;
  return (t: number): Vec3 => {
    const u = t % ROUTINE.period;
    const s = Math.min(u, ROUTINE.period - u);
    return [hand[0], hand[1] - down * s - (GRAVITY * s * s) / 2, hand[2]];
  };
}
/** The toss: from his palm as it lets go, up and down onto the racket's sweet spot at the serve's contact. */
function tossBall(spot: Vec3, reach: Reach, takes: number) {
  const from = toWorld(spot, FACE.yash, add(reach.toss, PALM));
  const to = toWorld(spot, FACE.yash, reach.serve);
  const v: Vec3 = [
    (to[0] - from[0]) / takes,
    (to[1] - from[1]) / takes + (GRAVITY * takes) / 2,
    (to[2] - from[2]) / takes,
  ];
  return (s: number): Vec3 => [
    from[0] + v[0] * s,
    from[1] + v[1] * s - (GRAVITY * s * s) / 2,
    from[2] + v[2] * s,
  ];
}

/** The broadcast view, its target's x following the ball's recent x (null counts as the middle). */
const tvFollowing =
  (ball: (t: number) => Vec3 | null) =>
  (t: number): CameraPose => {
    let x = 0;
    for (let k = 0; k < PAN.samples; k++) x += ball(t - k * PAN.every)?.[0] ?? 0;
    const [, y, z] = CAMERA.tv.target;
    return { position: CAMERA.tv.position, target: [(CAMERA.pan * x) / PAN.samples, y, z] };
  };

/**
 * Whether this point ends the game: Yash wins it at 40. His score is read off the serve window, which only his 40
 * gives (desktop 0.7 s, the column 0.875 s); you win only the points where Yash stretches for your last ball.
 */
function endsGame(script: PointScript): boolean {
  const { windows, capped } = script.setup;
  const forty = [1, TOUCH_STRETCH].some(
    (k) => Math.abs(windows.serve - (WINDOW_MS.serve[3] * k) / 1000) < 1e-9,
  );
  const youWin = !capped && script.swings.at(-1)?.by === "yash";
  return forty && !youWin;
}

/** Both at their places before a point: Yash with the ball, the camera on the court. */
export function readyShotlist(setup: PointSetup, _reach: Reach): Shotlist {
  const actors = {} as Record<ActorId, Track>;
  for (const id of ACTORS)
    actors[id] = {
      home: homeOf(id, setup),
      face: FACE[id],
      clips: [{ clip: waitClip(id), start: 0, loop: true }],
      moves: [],
    };
  return {
    end: 0,
    ball: () => null,
    held: () => "yash",
    actors,
    camera: () => CAMERA.tv,
    glow: () => null,
    mark: null,
    cues: [],
    buzz: [],
  };
}

/** One point, from the first bounce of Yash's routine to the call (or, still pending, to the last ball's run-on). */
export function pointShotlist(script: PointScript, reach: Reach): Shotlist {
  const { setup, serveClipAt, tossAt, serveAt, flights } = script;
  const spot = SERVE_SPOT[setup.court];
  const last = flights.at(-1)!;
  const end = script.end ?? last.start + last.path.end;
  const routine = routineBall(spot, reach);
  const toss = tossBall(spot, reach, serveAt - tossAt);
  const ball = (t: number): Vec3 | null => {
    if (t < 0 || t > end) return null;
    if (t < serveClipAt) return routine(t);
    if (t < tossAt) return null;
    if (t < serveAt) return toss(t - tossAt);
    const f = flights.filter((f) => f.start <= t).at(-1)!;
    return f.path.at(t - f.start);
  };

  const bounces = Array.from(
    { length: Math.round(serveClipAt / ROUTINE.period) },
    (_, k) => (k + 0.5) * ROUTINE.period,
  );
  flights.forEach((f, i) => {
    const until = Math.min(flights[i + 1]?.start ?? Infinity, end);
    for (const b of f.path.bounces) if (f.start + b < until) bounces.push(f.start + b);
  });
  const cues: Cue[] = [
    ...script.swings.filter((w) => w.meets).map((w) => ({ at: w.contact, sound: "hit" as const })),
    ...bounces.map((at) => ({ at, sound: "court" as const })),
  ];
  if (script.mark) cues.push({ at: script.mark.from, sound: "ooh" });
  if (script.end !== null && !endsGame(script)) cues.push({ at: end - 0.3, sound: "applause" });
  cues.sort((a, b) => a.at - b.at);

  return {
    end,
    ball,
    held: (t) => (t >= serveClipAt && t < tossAt ? "yash" : null),
    actors: { yash: playerTrack("yash", script), you: playerTrack("you", script) },
    camera: tvFollowing(ball),
    glow: (t) => {
      const w = script.windows.find((w) => t >= w.opens && t < w.commits + SWING_LEAD);
      return w ? { side: w.open, strength: clamp01((t - w.opens) / GLOW_RISE) } : null;
    },
    mark: script.mark,
    cues,
    buzz: script.contacts,
  };
}

/**
 * After a point, while the call shows: both walk (or, from far, jog) to `next`'s places, facing the walk, then face the
 * net, Yash with the next ball; the camera settles back. With no `next` it is GAME: Yash pumps his fist and the camera
 * pushes in toward him.
 */
export function walkShotlist(after: Shotlist, next: PointSetup | null): Shotlist {
  const callS = TENNIS_3D_BEATS.callMs / 1000;
  const arrive = callS - WALK.settle;
  const actors = {} as Record<ActorId, Track>;
  for (const id of ACTORS) {
    const was = sampleTrack(after.actors[id], after.end);
    const now = was.clips[0]!;
    const playing = after.actors[id].clips.filter((c) => c.start <= after.end).at(-1);
    // What was playing carries on as it was (at its speed) while the walk takes over.
    const track: Track = {
      home: was.position,
      face: was.face,
      clips: [{ clip: now.clip, start: 0, from: now.time, loop: now.loop, speed: playing?.speed }],
      moves: [],
    };
    actors[id] = track;
    if (!next) {
      if (id === "yash")
        track.clips.push(
          { clip: "fistPump", start: 0, fade: WALK.fade },
          { clip: "ready", start: FIST_PUMP_CLIP.end, loop: true, fade: 0.4 },
        );
      continue;
    }
    const to = homeOf(id, next);
    const d = ground(was.position, to);
    let there: number = WALK.fade;
    if (d >= 1e-3) {
      const clip = d > WALK.jogOver ? "jog" : "walk";
      // At least half the clip's pace (done sooner, then he waits), and never shorter than its fade.
      there = Math.max(Math.min(arrive, d / (SLOWEST_STEP * CLIP_PACE[clip])), WALK.fade);
      const speed = d / there / CLIP_PACE[clip];
      track.clips.push({ clip, start: 0, loop: true, speed, fade: WALK.fade });
      track.moves.push({
        start: 0,
        end: there,
        to,
        face: Math.atan2(to[0] - was.position[0], to[2] - was.position[2]),
        turn: WALK.fade,
      });
    }
    track.moves.push({ start: there, end: there, to, face: FACE[id], turn: WALK.settle });
    // Phased so the loop is at its start when the next point begins with it.
    const wait = waitClip(id);
    const period = PERIOD[wait]!;
    const from = (period - ((callS - there) % period)) % period;
    track.clips.push({ clip: wait, start: there, from, loop: true, fade: WALK.settle });
  }
  const from = after.camera(after.end);
  return {
    end: next ? callS : GAME_PUSH_S,
    ball: () => null,
    held: (t) => (next && t >= arrive ? "yash" : null),
    actors,
    camera: next
      ? (t) => blend(from, CAMERA.tv, smooth(t / 1.0))
      : (t) => blend(from, CAMERA.game, smooth(t / GAME_PUSH_S)),
    glow: () => null,
    mark: after.mark,
    cues: [],
    buzz: [],
  };
}
