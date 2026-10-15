import type { SoundName } from "@/shell/audio";
import { CRICKET_PERIOD_MS } from "../referee";
import { lerp3, sampleTrack, type ActorTrack, type Move, type Vec3 } from "../../three/track";
import { deliveryPath, groundTimeAt, heading, shotPath } from "./ball";
import type { Delivery } from "./delivery";
import type { Shot } from "./director";
import {
  ACTORS,
  CAMERA,
  FIELDERS,
  JUMP_Z,
  KEEPER_TAKE_Z,
  MARK,
  faceOf,
  homeOf,
  type ActorId,
  type CameraPose,
} from "./field";

export type CricketClip =
  | "idle"
  | "walk"
  | "jog"
  | "sprint"
  | "crouch"
  | "stance"
  | "bowl"
  | "dugOut"
  | "beaten"
  | "drive"
  | "flick"
  | "pull"
  | "loft"
  | "keeperTake"
  | "dive";
export type Track = ActorTrack<CricketClip>;
export type Sound = "clap" | "bounce" | "bat" | "ooh" | "crowd";
/** Compile-time check: every cue sound is a real `SoundName` (the two lists cannot drift). */
export const SOUNDS_ARE_NAMES: Sound extends SoundName ? true : never = true;
export interface Cue {
  at: number;
  sound: Sound;
}
/** Everything on the field as a function of time (s from its start). */
export interface Shotlist {
  end: number;
  ball(t: number): Vec3 | null;
  actors: Record<ActorId, Track>;
  camera(t: number): CameraPose;
  cues: Cue[];
}
export interface BallPlan {
  ball: number;
  delivery: Delivery;
  shot: Shot;
  /** When you pressed release (s from the run-up's start). */
  pressAt: number;
}

/** The run-up: the approach, then the meter's one sweep (today's crossing speed), and the strides in it. */
export const RUNUP = { approach: 1.2, sweep: CRICKET_PERIOD_MS / 1000, strides: 8 } as const;
/** The final leap: the meter's centre. */
export const LEAP_AT = RUNUP.approach + RUNUP.sweep / 2;
/** The meter's end: no press by now is released as a full toss. */
export const RUNUP_END = RUNUP.approach + RUNUP.sweep;
/** The bowling action lets go this long after it starts; each bat shot meets the ball this far into its clip. */
export const RELEASE_AFTER = 0.3;
export const SHOT_CONTACT: Record<Shot["kind"], number> = {
  dugOut: 0.3,
  beaten: 0.3,
  drive: 0.35,
  flick: 0.3,
  pull: 0.3,
  loft: 0.4,
};
export const DIVE_REACH = 0.35;
export const RUN_SPEED = 7;
export const CHASE_WITHIN = 15;
export const WALK_BACK_S = 2.6;
export const RESET_S = 2.0;
export const CAMERA_BLEND_S = 0.5;
export const SETTLE_S = 0.4;
export const FOLLOW = { behind: 14, ground: 8, air: 12, lag: 0.2 } as const;

const smooth = (f: number) => {
  const c = Math.min(1, Math.max(0, f));
  return c * c * (3 - 2 * c);
};
const blend = (a: CameraPose, b: CameraPose, f: number): CameraPose => ({
  position: lerp3(a.position, b.position, f),
  target: lerp3(a.target, b.target, f),
});
const aim = () => CAMERA.aim;
const restClip = (id: ActorId): CricketClip =>
  id === "yash" ? "stance" : id === "keeper" || id === "slip" ? "crouch" : "idle";

/** Everyone in place before ball `ball` (0 to 2), in their waiting moves. */
export function standing(ball: number): Record<ActorId, Track> {
  const all = {} as Record<ActorId, Track>;
  for (const id of ACTORS)
    all[id] = {
      home: homeOf(id, ball),
      face: faceOf(id),
      clips: [{ clip: restClip(id), start: 0, loop: true }],
      moves: [],
    };
  return all;
}

export const readyShotlist = (ball: number): Shotlist => ({
  end: 0,
  ball: () => null,
  actors: standing(ball),
  camera: aim,
  cues: [],
});

/** One clap per stride; his run eases in to the leap, so they come closer together. */
export const clapTimes = () =>
  Array.from({ length: RUNUP.strides }, (_, k) => LEAP_AT * Math.sqrt(k / RUNUP.strides));

const APPROACH: Move[] = [
  { start: 0, end: LEAP_AT, to: [MARK[0], 0, JUMP_Z], ease: "in" },
  { start: LEAP_AT, end: RUNUP_END, to: [MARK[0], 0, JUMP_Z - 0.8] },
];

/** The fielder nearest a drive's line sprints to cut it off and dives, always just short (a FOUR beats him). */
function chase(actors: Record<ActorId, Track>, bearing: number, from: Vec3, contact: number) {
  const [dx, dz] = heading(bearing);
  let best: { id: ActorId; s: number; d: number } | null = null;
  for (const id of FIELDERS) {
    const h = actors[id].home;
    const s = (h[0] - from[0]) * dx + (h[2] - from[2]) * dz;
    const d = Math.abs((h[0] - from[0]) * dz - (h[2] - from[2]) * dx);
    if (s >= 5 && d < CHASE_WITHIN && (!best || d < best.d)) best = { id, s, d };
  }
  if (!best) return;
  const h = actors[best.id].home;
  const q: Vec3 = [from[0] + dx * best.s, 0, from[2] + dz * best.s];
  const toQ = Math.hypot(q[0] - h[0], q[2] - h[2]);
  const tc = contact + groundTimeAt(best.s);
  const go = contact + 0.15;
  const runFor = Math.max(0, tc - DIVE_REACH - go);
  const reach = Math.min((RUN_SPEED * runFor) / toQ, (toQ - 1.2) / toQ);
  const face = Math.atan2(q[0] - h[0], q[2] - h[2]);
  const a = actors[best.id];
  a.clips.push(
    { clip: "sprint", start: go, loop: true },
    { clip: "dive", start: tc - DIVE_REACH },
    { clip: "idle", start: tc + 1.2, loop: true },
  );
  a.moves = [
    { start: go, end: tc - DIVE_REACH, to: lerp3(h, q, Math.max(0, reach)), face },
    {
      start: tc - DIVE_REACH,
      end: tc + 0.15,
      to: lerp3(h, q, Math.max(0, reach) + 0.8 / toQ),
      ease: "out",
    },
  ];
}

/** Ball `ball`: the run-up and, once you have pressed release, the ball, Yash's shot, the chase and the camera. */
export function ballShotlist(ball: number, plan: BallPlan | null): Shotlist {
  const actors = standing(ball);
  actors.bowler.clips = [{ clip: "sprint", start: 0, loop: true }];
  actors.bowler.moves = [...APPROACH];
  if (!plan)
    return {
      end: RUNUP_END,
      ball: () => null,
      actors,
      camera: aim,
      cues: clapTimes().map((at) => ({ at, sound: "clap" as const })),
    };

  const { delivery, shot, pressAt } = plan;
  const release = pressAt + RELEASE_AFTER;
  const atPress = sampleTrack(actors.bowler, pressAt).position;
  actors.bowler.clips.push(
    { clip: "bowl", start: pressAt },
    { clip: "idle", start: release + 1.0, loop: true },
  );
  actors.bowler.moves = [
    { start: 0, end: pressAt, to: atPress },
    { start: release, end: release + 0.8, to: [atPress[0], 0, atPress[2] - 3], ease: "out" },
  ];

  const toBat = deliveryPath(delivery);
  const contact = release + toBat.duration;
  actors.yash.clips.push(
    { clip: shot.kind, start: contact - SHOT_CONTACT[shot.kind] },
    { clip: "idle", start: contact + 1.2, loop: true },
  );
  const cues: Cue[] = [];
  if (toBat.bounceAt !== null) cues.push({ at: release + toBat.bounceAt, sound: "bounce" });

  if (shot.kind === "beaten") {
    const past = deliveryPath(delivery, KEEPER_TAKE_Z);
    const take = release + past.duration;
    actors.keeper.clips.push(
      { clip: "keeperTake", start: take - 0.25 },
      { clip: "crouch", start: take + 1.0, loop: true },
    );
    cues.push({ at: contact, sound: "ooh" });
    return {
      end: take + 0.6 + SETTLE_S,
      ball: (t) => (t >= release && t <= take ? past.at(t - release) : null),
      actors,
      camera: aim,
      cues,
    };
  }

  const from = toBat.at(toBat.duration);
  const after = shotPath(shot.kind, shot.bearing, from);
  const flightEnd = contact + after.duration;
  const ballAt = (t: number): Vec3 | null =>
    t < release
      ? null
      : t < contact
        ? toBat.at(t - release)
        : t <= flightEnd
          ? after.at(t - contact)
          : null;
  cues.push({ at: contact, sound: "bat" });
  if (after.boundaryAt !== null) cues.push({ at: contact + after.boundaryAt, sound: "crowd" });
  if (shot.kind === "drive" || shot.kind === "flick") chase(actors, shot.bearing, from, contact);

  const [dx, dz] = heading(shot.bearing);
  const lift = shot.kind === "pull" || shot.kind === "loft" ? FOLLOW.air : FOLLOW.ground;
  const camera = (t: number): CameraPose => {
    if (shot.kind === "dugOut" || t <= contact) return aim();
    const now = Math.min(t, flightEnd);
    const lead = ballAt(now) ?? from;
    const lag = ballAt(Math.max(contact, now - FOLLOW.lag)) ?? from;
    const follow: CameraPose = {
      position: [lag[0] - dx * FOLLOW.behind, lag[1] + lift, lag[2] - dz * FOLLOW.behind],
      target: lead,
    };
    return blend(aim(), follow, smooth((t - contact) / CAMERA_BLEND_S));
  };
  return { end: flightEnd + SETTLE_S, ball: ballAt, actors, camera, cues };
}

/** After a ball: everyone walks back to their places for ball `next`, the bowler jogs to his mark, the camera returns. */
export function walkBackShotlist(prev: Shotlist, next: number): Shotlist {
  const actors = standing(next);
  for (const id of ACTORS) {
    const was = sampleTrack(prev.actors[id], prev.end);
    const to = homeOf(id, next);
    const a = actors[id];
    a.home = was.position;
    a.face = was.face;
    const far = Math.hypot(to[0] - was.position[0], to[2] - was.position[2]) > 0.3;
    if (!far) {
      if (id === "yash")
        a.clips = [
          { clip: "idle", start: 0, loop: true },
          { clip: "stance", start: 1.6, loop: true },
        ];
      continue;
    }
    const dur = id === "bowler" ? WALK_BACK_S : RESET_S;
    a.clips = [
      { clip: id === "bowler" ? "jog" : "walk", start: 0, loop: true },
      { clip: restClip(id), start: dur, loop: true },
    ];
    a.moves = [
      {
        start: 0,
        end: dur,
        to,
        face: Math.atan2(to[0] - was.position[0], to[2] - was.position[2]),
      },
      { start: dur, end: dur, to, face: faceOf(id) },
    ];
  }
  const from = prev.camera(prev.end);
  return {
    end: WALK_BACK_S,
    ball: () => null,
    actors,
    camera: (t) => blend(from, aim(), smooth(t / 1.0)),
    cues: [],
  };
}
