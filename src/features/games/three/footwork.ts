import { ground } from "./geometry";
import { CLIP_PACE } from "./rig";
import {
  lerp3,
  sampleTrack,
  type ActorTrack,
  type CameraPose,
  type ClipSeg,
  type Vec3,
} from "./track";

/** A run this short or this slow is a side shuffle, facing the net; from `sprint` m/s it is a sprint, else a jog. */
export const FOOTWORK = { shuffleUnder: 1, shuffleSlower: 2.7, sprint: 4 } as const;
/**
 * A shuffle or a walk never plays slower than this (its clip speed): a short, slow one is done sooner, and he waits.
 * The runs (jog, sprint) are only chosen from FOOTWORK.shuffleSlower, so they play at 0.44 or more.
 */
export const SLOWEST_STEP = 0.5;
/** How long a player takes to turn toward a run, and back to the net as he arrives (s). */
export const TURN = { out: 0.15, back: 0.2 } as const;
/** The camera's pan follows the ball's x over the last 0.6 s: these many samples, this far apart. */
export const PAN = { samples: 5, every: 0.15 } as const;
/** Between points: past this far a player jogs back instead of walking; he is there this long before the call ends. */
export const WALK = { jogOver: 2.6, settle: 0.2, fade: 0.3 } as const;

/**
 * The clips a game's players move with, so this file names none: the two side shuffles (to his left and right, the
 * clip's ground speed at clip speed 1 being `shufflePace` m/s), the jog, the sprint, the walk, and the stance he
 * settles into. The jog, sprint and walk play at the speed `CLIP_PACE` says keeps the feet still.
 */
export interface Gait<C> {
  shuffleLeft: C;
  shuffleRight: C;
  shufflePace: number;
  /** A move slower than this (m/s) is a side shuffle, facing the net, however long (default FOOTWORK.shuffleSlower). */
  shuffleMax?: number;
  jog: C;
  sprint: C;
  walk: C;
  ready: C;
}

/** Adds a clip; any clip from its start on is dropped (a later plan replaces an earlier one). */
export function addClip<C extends string>(track: ActorTrack<C>, seg: ClipSeg<C>) {
  track.clips = track.clips.filter((c) => c.start < seg.start);
  track.clips.push(seg);
}
/** Stops whatever walk is under way at `t`, where it has got to (every move here is linear). */
export function cutMoves<C extends string>(track: ActorTrack<C>, t: number) {
  const at = sampleTrack(track, t).position;
  track.moves = track.moves
    .filter((m) => m.start < t)
    .map((m) => (m.end > t ? { ...m, end: t, to: at } : m));
}

export interface Leg {
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
 * A player facing `face` (the net) gets from where he is to `leg.to`: a side shuffle (facing the net) when short or
 * slow, else a jog or a sprint facing the run. Each clip plays at the speed that keeps the feet still (ground speed /
 * its pace). Returns when he gets there (a slow shuffle is done before `leg.end`), or null when he is already there.
 */
export function travel<C extends string>(
  track: ActorTrack<C>,
  face: number,
  leg: Leg,
  gait: Gait<C>,
): number | null {
  const from = sampleTrack(track, leg.start).position;
  const dx = leg.to[0] - from[0];
  const dz = leg.to[2] - from[2];
  const d = Math.hypot(dx, dz);
  if (d < 1e-3) return null;
  const v = d / (leg.end - leg.start);
  if (d < FOOTWORK.shuffleUnder || v < (gait.shuffleMax ?? FOOTWORK.shuffleSlower)) {
    // The player's left, in the world: x cos(face), z −sin(face).
    const left = dx * Math.cos(face) - dz * Math.sin(face) > 0;
    const clip = left ? gait.shuffleLeft : gait.shuffleRight;
    // Done early (not before its clip has faded in, so three clips never blend), if there is room to settle.
    const early = Math.max(
      leg.start + d / (SLOWEST_STEP * gait.shufflePace),
      leg.clipAt + leg.fade,
    );
    const slow = v < SLOWEST_STEP * gait.shufflePace && early + 0.15 <= leg.settleBy;
    const end = slow ? early : leg.end;
    const pace = d / (end - leg.start);
    addClip(track, {
      clip,
      start: leg.clipAt,
      loop: true,
      speed: pace / gait.shufflePace,
      fade: leg.fade,
    });
    track.moves.push({ start: leg.start, end, to: leg.to, face, turn: TURN.back });
    return end;
  }
  const run = v < FOOTWORK.sprint ? "jog" : "sprint";
  addClip(track, {
    clip: gait[run],
    start: leg.clipAt,
    loop: true,
    speed: v / CLIP_PACE[run],
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
    { start: back, end: leg.end, to: leg.to, face, turn: leg.back },
  );
  return leg.end;
}

/** A recovery (a shuffle or a run back toward the middle), then ready. */
export function recoverTo<C extends string>(
  track: ActorTrack<C>,
  face: number,
  r: { start: number; end: number; to: Vec3 },
  gait: Gait<C>,
  clipAt = r.start,
  fade = 0.2,
) {
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
  const there = travel(track, face, leg, gait) ?? clipAt;
  addClip(track, { clip: gait.ready, start: there, loop: true, fade });
}

/**
 * One player's track for the call between points, from `was` (his track of the point just played, which ended at `at`).
 * What was playing carries on as it was (at its speed) from time 0. With a `to`, he walks (or, from far, jogs) there,
 * facing the walk, then faces `face` (the net), and `wait.clip` (a loop of `wait.period` s) starts as he arrives,
 * phased so the loop is at its start when the next point begins with it, `holdS` s after time 0 (`callS` unless the
 * call is held longer, as it is for a spotlight: the walk keeps its length and he waits in the loop until then). With
 * no `to` (the game's end) he just carries on and the caller adds what comes next.
 */
export function walkBack<C extends string>(
  was: ActorTrack<C>,
  at: number,
  to: Vec3 | null,
  face: number,
  wait: { clip: C; period: number },
  callS: number,
  gait: Gait<C>,
  holdS: number = callS,
): ActorTrack<C> {
  const here = sampleTrack(was, at);
  const now = here.clips[0]!;
  const playing = was.clips.filter((c) => c.start <= at).at(-1);
  const track: ActorTrack<C> = {
    home: here.position,
    face: here.face,
    clips: [{ clip: now.clip, start: 0, from: now.time, loop: now.loop, speed: playing?.speed }],
    moves: [],
  };
  if (!to) return track;
  const arrive = callS - WALK.settle;
  const d = ground(here.position, to);
  let there: number = WALK.fade;
  if (d >= 1e-3) {
    const run = d > WALK.jogOver ? "jog" : "walk";
    // At least half the clip's pace (done sooner, then he waits), and never shorter than its fade.
    there = Math.max(Math.min(arrive, d / (SLOWEST_STEP * CLIP_PACE[run])), WALK.fade);
    const speed = d / there / CLIP_PACE[run];
    track.clips.push({ clip: gait[run], start: 0, loop: true, speed, fade: WALK.fade });
    track.moves.push({
      start: 0,
      end: there,
      to,
      face: Math.atan2(to[0] - here.position[0], to[2] - here.position[2]),
      turn: WALK.fade,
    });
  }
  track.moves.push({ start: there, end: there, to, face, turn: WALK.settle });
  const from = (wait.period - ((holdS - there) % wait.period)) % wait.period;
  track.clips.push({ clip: wait.clip, start: there, from, loop: true, fade: WALK.settle });
  return track;
}

/** A camera that keeps `tv`'s pose but pans its target's x toward the ball's recent x (`pan` of it; null counts as the middle). */
export const followBall =
  (ball: (t: number) => Vec3 | null, tv: CameraPose, pan: number) =>
  (t: number): CameraPose => {
    let x = 0;
    for (let k = 0; k < PAN.samples; k++) x += ball(t - k * PAN.every)?.[0] ?? 0;
    const [, y, z] = tv.target;
    return { position: tv.position, target: [(pan * x) / PAN.samples, y, z] };
  };
