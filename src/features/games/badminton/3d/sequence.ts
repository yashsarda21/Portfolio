import type { SoundName } from "@/shell/audio";
import type { GameLayout } from "../../engine/types";
import {
  addClip,
  cutMoves,
  followBall,
  FOOTWORK,
  recoverTo,
  SLOWEST_STEP,
  travel,
  TURN,
  walkBack,
  WALK,
  type Gait,
  type Leg,
} from "../../three/footwork";
import { clamp, ground, smooth, toWorld } from "../../three/geometry";
import {
  CROSSFADE_S,
  lerp3,
  sampleTrack,
  type ActorTrack,
  type CameraPose,
} from "../../three/track";
import { BOX_X, boxX, CAMERA, FACE, RECEIVE_Z, SERVE_SPOT_Z, type Vec3 } from "./court";
import { BADMINTON_3D_BEATS, type Dir, type Player } from "./match";
import type { RallyScript, RallySetup, Recover, Swing } from "./rally";
// Type only: reach.ts imports three, and this file is reached from the first load (tennis ruling R3).
import type { Reach } from "./reach";
import { flyTo, heading, type ShuttlePath } from "./shuttle";
import {
  BLOCK_CLIP,
  DIVE_CLIP,
  DIVE_LANDS,
  FIST_PUMP_CLIP,
  JUMP_SMASH_CLIP,
  LIFT_CLIP,
  MISS,
  NET_CLIP,
  OVERHEAD_CLIP,
  RUN_AFTER,
  SERVE_CLIP,
  SHUFFLE_PACE,
  SPLIT_CLIP,
  STRETCH_CLIP,
  SWING_LEAD,
  type BadmintonClip,
  type Stroke,
} from "./timing";

export type Track = ActorTrack<BadmintonClip>;
export type Sound = "shuttle" | "squeak" | "applause" | "ooh";
/** Compile-time check: every cue sound is a real `SoundName` (the two lists cannot drift). */
export const SOUNDS_ARE_NAMES: Sound extends SoundName ? true : never = true;
export interface Cue {
  at: number;
  sound: Sound;
}
/** Everything on the court as a function of time (s from its start). */
export interface Shotlist {
  end: number;
  /** Where the shuttle is and which way its cork points (a unit vector), or null while it is in a hand (or gone). */
  shuttle(t: number): { at: Vec3; heading: Vec3 } | null;
  /** Who holds the shuttle in his left hand at `t` (the scene hangs it from that hand), or null. */
  held(t: number): Player | null;
  actors: Record<Player, Track>;
  /** The camera for each layout (court.ts CAMERA). */
  camera(t: number, layout: GameLayout): CameraPose;
  /** The open part's glow on Yash's half while a window is open (ruling P1): the part and its strength (0 to 1). */
  glow(t: number): { part: Dir; strength: number } | null;
  mark: { at: Vec3; from: number } | null;
  cues: Cue[];
  /** When your racket meets the shuttle: the phone buzzes. */
  buzz: number[];
}

/** The glow on the open part rises over this long. */
export const GLOW_RISE = 0.15;
/** At GAME the camera pushes in over this long. */
export const GAME_PUSH_S = 3;
/** Two shoe squeaks are never closer than this (s). */
export const SQUEAK_GAP = 0.3;
/** The applause comes this long before a rally's end. */
export const APPLAUSE_LEAD = 0.3;
/** Back on his feet after a dive, he turns to face the net over this long (s). */
export const GET_UP_TURN = 0.4;
/**
 * The lunges (the net shot, the lift and the beaten stretches, moves.ts): the right foot drives out at `drive`, its heel
 * lands at `heel` (s into the clip).
 */
export const LUNGE = { drive: 0.12, heel: 0.28 } as const;

const PLAYERS: readonly Player[] = ["yash", "you"];
/** The ready stance's sway loop (s): the walk back phases it so it is at its start when the rally begins. */
const READY_PERIOD = 1.2;
/** A shuttle let go hangs cork down, and falls so. */
const CORK_DOWN: Vec3 = [0, -1, 0];
/**
 * The same clip carrying on at a new speed is no blend (the scene has one action per clip, so the two would fight):
 * it hands over in this long, under any frame.
 */
const RETIME = 1e-6;
/** A run turns back to the swing's heading over at least this long before it arrives (never a spin on the spot). */
const TURN_IN = 0.3;
/** A shuffle done before its stroke settles into ready over this long, as the stroke starts. */
const SETTLE = 0.15;

/**
 * Badminton moves side-on (the chassé) up to this speed (m/s), where tennis jogs from FOOTWORK.shuffleSlower: a player
 * moving back to block or to the rear court never turns his back on the shuttle.
 */
export const SHUFFLE_MAX = 3.2;
/** Badminton's clips for the shared footwork: Yash and you move alike. */
const GAIT: Gait<BadmintonClip> = {
  shuffleLeft: "shuffleL",
  shuffleRight: "shuffleR",
  shufflePace: SHUFFLE_PACE,
  shuffleMax: SHUFFLE_MAX,
  jog: "jog",
  sprint: "sprint",
  walk: "walk",
  ready: "ready",
};
/** Moving back (away from the net) he stays side-on however quick, the chassé: he never turns his back on the shuttle. */
const BACK_GAIT: Gait<BadmintonClip> = { ...GAIT, shuffleMax: Infinity };
/** The gait for a move to `to` facing `face`: BACK_GAIT for a move more than 120° from the way he faces. */
const gaitFor = (track: Track, at: number, to: Vec3, face: number) => {
  const from = sampleTrack(track, at).position;
  return Math.cos(Math.atan2(to[0] - from[0], to[2] - from[2]) - face) < -0.5 ? BACK_GAIT : GAIT;
};
/** Each stroke's contact and end (s into its clip). */
const CLIP: Record<Stroke, { contact: number; end: number }> = {
  serve: SERVE_CLIP,
  overhead: OVERHEAD_CLIP,
  jumpSmash: JUMP_SMASH_CLIP,
  net: NET_CLIP,
  lift: LIFT_CLIP,
  block: BLOCK_CLIP,
  dive: DIVE_CLIP,
};
/**
 * How far into each stroke the run has arrived and the feet plant: the stroke fades in over this long while the run
 * finishes (R13). The overhead's forward swing starts there (SWING_LEAD before contact), the jump smash takes off, a
 * lunge's front foot drives out, the block's knees are down, the dive pushes off.
 */
const PLANT: Record<Exclude<Stroke, "serve">, number> = {
  overhead: OVERHEAD_CLIP.commit,
  jumpSmash: JUMP_SMASH_CLIP.takeoff,
  net: LUNGE.drive,
  lift: LUNGE.drive,
  block: LUNGE.drive,
  dive: DIVE_CLIP.launch,
};

const blend = (a: CameraPose, b: CameraPose, f: number): CameraPose => ({
  position: lerp3(a.position, b.position, f),
  target: lerp3(a.target, b.target, f),
});

/** Where a player waits before a rally: the server on his box's serve spot, the receiver in the box diagonally opposite. */
export function placeOf(p: Player, setup: RallySetup): Vec3 {
  const z = p === setup.server ? SERVE_SPOT_Z : RECEIVE_Z;
  return [boxX(p, setup.box) * BOX_X, 0, p === "yash" ? -z : z];
}

/**
 * On 20 once the OUT is used, or in the final, Yash reads your first shot (rally.ts plays it to where he moved): he
 * sets off as your forward swing starts, before you hit.
 */
const reads = (s: RallySetup) => s.kind !== "dive" && s.on20 && (s.outUsed || s.kind === "final");

/** Whether this rally ends the game: Yash wins the placement rally with you on 19, or the final. */
function endsGame(script: RallyScript): boolean {
  const { kind, on20 } = script.setup;
  // The rally is yours only when your last shot is the winner: met, not missed, and not (on 20) into the net.
  const last = script.swings.at(-1);
  const yours = last?.by === "you" && last.meets && !last.miss && !on20;
  return !yours && (kind === "final" || (kind === "placement" && !on20));
}

/** `path` as it is when it is hit again, `end` s in: the cork turns over from the way it was going then. */
const until = (path: ShuttlePath, end: number): ShuttlePath => ({
  end,
  lands: null,
  at: (t) => path.at(Math.min(t, end)),
  velocity: (t) => path.velocity(Math.min(t, end)),
});

/** The stretch toward the player's own right is the forehand lunge; `side` is the screen's (+x is your right). */
const stretchClip = (p: Player, side: "left" | "right"): BadmintonClip =>
  // The player's right, in the world, has x −cos(face).
  (side === "right" ? 1 : -1) * -Math.cos(FACE[p]) > 0 ? "stretchF" : "stretchB";

interface Plan {
  track: Track;
  /** When his shoes squeak: a lunge's heel, a run's sharp stop, the dive's landing. */
  squeaks: number[];
  /** He can set off on a new move from here (he is on his feet). */
  free: number;
}

/** The earliest a new clip may start at or after `t`: once the clip playing then has faded in (two blend, never three). */
function freeAt(track: Track, t: number): number {
  const k = track.clips.findLastIndex((c) => c.start < t);
  const c = track.clips[k];
  return k > 0 ? Math.max(t, c!.start + (c!.fade ?? CROSSFADE_S)) : t;
}

/**
 * A run (or shuffle) from where he is: if it is a run, its sharp stop squeaks. A shuffle that carries on one under
 * way (the same clip) carries on in its stride, at the new speed.
 */
function legTo(plan: Plan, face: number, leg: Leg): number | null {
  const there = travel(plan.track, face, leg, gaitFor(plan.track, leg.start, leg.to, face));
  if (there === null) return null;
  const { clips } = plan.track;
  const [was, now] = [clips.at(-2), clips.at(-1)!];
  if (was?.clip === now.clip) {
    const from = (was.from ?? 0) + (now.start - was.start) * (was.speed ?? 1);
    clips[clips.length - 1] = { ...now, from, fade: RETIME };
  }
  if (now.clip === "jog" || now.clip === "sprint") plan.squeaks.push(there);
  return there;
}

/**
 * One swing: the split step at the other's `hit`, the run (or shuffle) to the swing's spot arriving as the stroke
 * plants, turning to the swing's heading, the stroke on its contact, then ready. A late miss is the overhead he was set
 * for until its commit (the pick is known only then): he holds it there as the shuttle goes by, then swings on, the
 * racket reaching its place MISS.late after the shuttle. An early one is the same overhead, planned sooner (rally.ts).
 * The dive plays where he stands, turned toward the shuttle; he stays where its slide leaves him and gets up.
 */
function swing(plan: Plan, p: Player, w: Swing, hit: number, read = false) {
  const { track } = plan;
  const late = w.miss === "late";
  const stretch = w.kind === "stretch";
  const k = w.kind as Exclude<Stroke, "serve">;
  // A late swing keeps the meeting swing's timing up to its commit (the shuttle's moment − SWING_LEAD).
  const on = late ? w.contact - MISS.late : w.contact;
  const plant = stretch ? STRETCH_CLIP.reach : PLANT[k];
  const clipAt = on - (stretch ? STRETCH_CLIP.reach : CLIP[k].contact);
  const arrive = clipAt + plant;
  const to = w.spot;

  // Still getting up from a dive at the other's hit: no split step, he sets off once he is up. On a read he is not
  // answering a hit: he sets off at `hit` (your commit) with no split step.
  const at = freeAt(track, Math.max(hit, plan.free));
  const split = !read && hit >= plan.free && at + RUN_AFTER <= clipAt;
  const go = split ? at + RUN_AFTER : at;
  cutMoves(track, go);
  if (split) addClip(track, { clip: "split", start: at, fade: RUN_AFTER });
  // A short or slow move is a shuffle: done as the stroke starts (so the whole stroke is planted) when it fits at a
  // shuffle's pace, else at least at half its pace, into the stroke's fade. A run arrives as the stroke plants (R13).
  const far = ground(sampleTrack(track, go).position, to);
  const quick = clipAt - SETTLE;
  const most = gaitFor(track, go, to, w.face).shuffleMax!;
  const shuffle = far < FOOTWORK.shuffleUnder || far / (arrive - go) < most;
  const fits = quick - go >= TURN.out - 1e-9 && far / (quick - go) <= SHUFFLE_MAX;
  const slowest = clamp(go + far / (SLOWEST_STEP * SHUFFLE_PACE), clipAt, arrive);
  const leg: Leg = {
    clipAt: go,
    start: go,
    end: !shuffle ? arrive : fits ? quick : slowest,
    to,
    fade: TURN.out,
    backAt: Math.min(clipAt, arrive - TURN_IN),
    back: Math.max(plant, TURN_IN),
    settleBy: clipAt,
  };
  const there = clipAt - go >= TURN.out ? legTo(plan, w.face, leg) : null;
  // Already there (within a millimetre, closed as he turns): he only turns to the swing's heading.
  if (there === null) {
    const end = Math.min(go + TURN.back, clipAt);
    track.moves.push({ start: go, end, to, face: w.face, turn: TURN.back });
  }
  const settled = there ?? (split ? at + SPLIT_CLIP.end : null);
  if (settled !== null && clipAt >= settled + SETTLE - 1e-9)
    addClip(track, { clip: "ready", start: settled, loop: true, fade: SETTLE });

  const clip: BadmintonClip = stretch ? stretchClip(p, w.side ?? "right") : k;
  if (stretch) {
    // Beaten, he lunges as the shuttle goes by: once the clip before has faded in, a little quicker if it must be.
    const from = freeAt(track, clipAt);
    const speed = STRETCH_CLIP.reach / (w.contact - from);
    addClip(track, { clip, start: from, speed, fade: w.contact - from });
    plan.squeaks.push(from + LUNGE.heel / speed);
    addClip(track, {
      clip: "ready",
      start: from + STRETCH_CLIP.end / speed,
      loop: true,
      fade: 0.3,
    });
    return;
  }
  addClip(track, { clip, start: clipAt, fade: plant });
  if (k === "net" || k === "lift") plan.squeaks.push(clipAt + LUNGE.heel);

  if (k === "dive") {
    // Down until `up`; as the dive hands over to ready he is moved by the slide, so the body stays where it is.
    const up = clipAt + DIVE_CLIP.up;
    const stand = clipAt + DIVE_CLIP.end;
    const landing = toWorld(w.spot, w.face, DIVE_LANDS);
    addClip(track, { clip: "ready", start: up, loop: true, fade: stand - up });
    track.moves.push(
      { start: up, end: stand, to: landing },
      { start: stand, end: stand, to: landing, face: FACE[p], turn: GET_UP_TURN },
    );
    plan.squeaks.push(clipAt + DIVE_CLIP.floor);
    plan.free = stand;
    return;
  }
  if (late) {
    // Frozen at the commit while the shuttle goes by, then on: the racket reaches its place MISS.late after the shuttle.
    const commit = on - SWING_LEAD;
    addClip(track, { clip, start: commit, from: OVERHEAD_CLIP.commit, speed: 0, fade: 0.05 });
    addClip(track, { clip, start: commit + MISS.late, from: OVERHEAD_CLIP.commit, fade: 0.05 });
  }
  const done = w.contact + CLIP[k].end - CLIP[k].contact;
  addClip(track, { clip: "ready", start: done, loop: true, fade: 0.3 });
}

/** One player's rally: waiting in ready (the server with the shuttle), then each swing and recovery in turn. */
function playerPlan(p: Player, script: RallyScript): Plan {
  const { setup, swings, windows } = script;
  const plan: Plan = {
    track: { home: placeOf(p, setup), face: FACE[p], clips: [], moves: [] },
    squeaks: [],
    free: 0,
  };
  const { track } = plan;
  addClip(track, { clip: "ready", start: 0, loop: true });
  const mine = swings.filter((w) => w.by === p);
  const recs = script.recovers.filter((r) => r.by === p);
  // Yash's answer to your first shot: on a read he sets off at your commit, not your hit.
  const answer =
    p === "yash" && reads(setup) && windows[0]
      ? mine.find((w) => w.contact > windows[0]!.commits)
      : undefined;
  mine.forEach((w, i) => {
    if (w.kind === "serve") {
      // The left hand lets go at SERVE_CLIP.drop: the serve has its full weight by then, the hand where Reach.hold is.
      addClip(track, {
        clip: "serve",
        start: w.contact - SERVE_CLIP.contact,
        fade: SERVE_CLIP.drop,
      });
      const done = w.contact + SERVE_CLIP.end - SERVE_CLIP.contact;
      addClip(track, { clip: "ready", start: done, loop: true, fade: 0.3 });
    } else {
      const theirs = swings.filter((x) => x.by !== p && x.meets && x.contact < w.contact).at(-1)!;
      const read = w === answer;
      swing(plan, p, w, read ? windows[0]!.commits : theirs.contact, read);
    }
    const next = mine[i + 1]?.contact ?? Infinity;
    const r = recs.find((r) => r.start > w.contact && r.start < next);
    if (r) recover(plan, p, r);
  });
  return plan;
}
/** A recovery (a shuffle or a run back toward his base), then ready. */
function recover(plan: Plan, p: Player, r: Recover) {
  const from = plan.track.clips.length;
  recoverTo(plan.track, FACE[p], r, gaitFor(plan.track, r.start, r.to, FACE[p]));
  const run = plan.track.clips[from]?.clip;
  if (run === "jog" || run === "sprint") plan.squeaks.push(r.end);
}

/** Squeaks in order, never two within SQUEAK_GAP: the later one is dropped. */
function thin(times: number[], end: number): number[] {
  const kept: number[] = [];
  for (const t of [...times].sort((a, b) => a - b))
    if (t >= 0 && t <= end && (kept.length === 0 || t - kept.at(-1)! >= SQUEAK_GAP)) kept.push(t);
  return kept;
}

/** Both at their places before a rally, the server with the shuttle, the camera on the court. */
export function readyShotlist(setup: RallySetup): Shotlist {
  const actors = {} as Record<Player, Track>;
  for (const p of PLAYERS)
    actors[p] = {
      home: placeOf(p, setup),
      face: FACE[p],
      clips: [{ clip: "ready", start: 0, loop: true }],
      moves: [],
    };
  return {
    end: 0,
    shuttle: () => null,
    held: () => setup.server,
    actors,
    camera: (_, layout) => CAMERA.tv[layout],
    glow: () => null,
    mark: null,
    cues: [],
    buzz: [],
  };
}

/** One rally, from the server's wait to the call (or, while a pick is to come, to the last shuttle's run-on). */
export function rallyShotlist(script: RallyScript, reach: Reach): Shotlist {
  const { setup, serveAt, flights } = script;
  const serve = script.swings[0]!;
  const last = flights.at(-1)!;
  const end = script.end ?? last.start + last.path.end;
  // Let go at the drop, the shuttle falls freely onto the racket's sweet spot at the serve's contact.
  const falls = SERVE_CLIP.contact - SERVE_CLIP.drop;
  const drop = serveAt - falls;
  const fall = flyTo(
    toWorld(serve.spot, serve.face, reach.hold),
    toWorld(serve.spot, serve.face, reach.serve),
    falls,
  );
  const fell = until(fall, falls);
  const shuttle = (t: number) => {
    if (t < drop || t > end) return null;
    if (t < serveAt) return { at: fall.at(t - drop), heading: CORK_DOWN };
    const i = flights.findLastIndex((f) => f.start <= t);
    const f = flights[i]!;
    const was = flights[i - 1];
    const prev = was ? until(was.path, f.start - was.start) : fell;
    return { at: f.path.at(t - f.start), heading: heading(prev, f.path, t - f.start) };
  };

  const plans = { yash: playerPlan("yash", script), you: playerPlan("you", script) };
  const cues: Cue[] = [
    ...script.contacts.map((at) => ({ at, sound: "shuttle" as const })),
    ...thin([...plans.yash.squeaks, ...plans.you.squeaks], end).map((at) => ({
      at,
      sound: "squeak" as const,
    })),
  ];
  if (script.mark) cues.push({ at: script.mark.from, sound: "ooh" });
  if (script.end !== null && !endsGame(script))
    cues.push({ at: end - APPLAUSE_LEAD, sound: "applause" });
  cues.sort((a, b) => a.at - b.at);

  return {
    end,
    shuttle,
    held: (t) => (t < drop ? setup.server : null),
    actors: { yash: plans.yash.track, you: plans.you.track },
    camera: (t, layout) =>
      followBall((t) => shuttle(t)?.at ?? null, CAMERA.tv[layout], CAMERA.pan)(t),
    glow: (t) => {
      const w = script.windows.find((w) => t >= w.opens && t < w.commits + SWING_LEAD);
      return w ? { part: w.open, strength: clamp((t - w.opens) / GLOW_RISE, 0, 1) } : null;
    },
    mark: script.mark,
    cues,
    buzz: script.swings.filter((w) => w.by === "you" && w.meets).map((w) => w.contact),
  };
}

/**
 * After a rally, while the call shows: both walk (or, from far, jog) to `next`'s places, facing the walk, then face
 * the net, the next server with the shuttle; the camera settles back. With no `next` it is GAME: Yash pumps his fist
 * and the camera pushes in toward him.
 */
export function walkShotlist(after: Shotlist, next: RallySetup | null): Shotlist {
  const callS = BADMINTON_3D_BEATS.callMs / 1000;
  const arrive = callS - WALK.settle;
  const actors = {} as Record<Player, Track>;
  for (const p of PLAYERS) {
    const to = next ? placeOf(p, next) : null;
    const track = walkBack(
      after.actors[p],
      after.end,
      to,
      FACE[p],
      { clip: "ready", period: READY_PERIOD },
      callS,
      GAIT,
    );
    actors[p] = track;
    if (!next && p === "yash")
      track.clips.push(
        { clip: "fistPump", start: 0, fade: WALK.fade },
        { clip: "ready", start: FIST_PUMP_CLIP.end, loop: true, fade: 0.4 },
      );
  }
  const from = (layout: GameLayout) => after.camera(after.end, layout);
  // GAME: the camera pushes in to Yash, where the rally left him (CAMERA.game is from his feet).
  const yash = sampleTrack(after.actors.yash, after.end).position;
  const fromYash = (v: Vec3): Vec3 => [yash[0] + v[0], yash[1] + v[1], yash[2] + v[2]];
  const game = (layout: GameLayout): CameraPose => ({
    position: fromYash(CAMERA.game[layout].position),
    target: fromYash(CAMERA.game[layout].target),
  });
  return {
    end: next ? callS : GAME_PUSH_S,
    shuttle: () => null,
    held: (t) => (next && t >= arrive ? next.server : null),
    actors,
    camera: next
      ? (t, layout) => blend(from(layout), CAMERA.tv[layout], smooth(t / 1.0))
      : (t, layout) => blend(from(layout), game(layout), smooth(t / GAME_PUSH_S)),
    glow: () => null,
    mark: after.mark,
    cues: [],
    buzz: [],
  };
}
