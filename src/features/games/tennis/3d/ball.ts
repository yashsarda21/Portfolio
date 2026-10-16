import { BALL_RADIUS, COURT, GRAVITY, type Vec3 } from "./court";

/** What the hard court keeps of the ball's speed along it at a bounce (the up-speed is solved per shot: `kv`). */
export const KH = 0.62;
/** The up-speed kept at the bounces after the first (a ball running on after the point). */
export const BOUNCE_ON = 0.7;
/** Extra downward pull (m/s²): topspin on rally shots; serves fly flat. */
export const SPIN = { serve: 0, rally: 4 } as const;
/** Every ball over the net clears the tape by at least this (m). */
export const NET_CLEAR = 0.15;
/** How long a ball runs on after its contact or its bounce (s); it is hidden when the point ends. */
export const RUN_ON_S = 1.6;
/** The fences: a ball that reaches one stops going along and drops. */
export const FENCE = {
  z: COURT.half + COURT.runoff.back,
  x: COURT.doubles + COURT.runoff.side,
} as const;

export interface BallPath {
  /** When it reaches its target (s from the hit): the racket, its bounce, or the net. */
  readonly reach: number;
  /** When it has run on long enough for the point to be called (s). */
  readonly end: number;
  /** Where the ball's centre is `t` s after the hit (clamped to [0, end]). */
  at(t: number): Vec3;
  /** Every time it meets the court (s from the hit). */
  readonly bounces: readonly number[];
  /** Where it first meets the court, or null (into the net before any bounce). */
  readonly bounce: Vec3 | null;
  /** The up-speed kept at its first bounce: 0.5–0.9 looks like a real hard court. */
  readonly kv: number;
}

interface Arc {
  t0: number;
  p: Vec3;
  v: Vec3;
  g: number;
}
const floor = BALL_RADIUS;
const along = (a: Arc, t: number): Vec3 => {
  const d = t - a.t0;
  return [a.p[0] + a.v[0] * d, a.p[1] + a.v[1] * d - (a.g * d * d) / 2, a.p[2] + a.v[2] * d];
};
const toFence = (pos: number, vel: number, limit: number) =>
  vel === 0 ? Infinity : (Math.sign(vel) * limit - pos) / vel;

/** The ball after `start`: bouncing on the court (keeping BOUNCE_ON up, KH along), dropping at a fence, then at rest. */
function runOn(start: Arc, until: number): { arcs: Arc[]; bounces: number[] } {
  const arcs: Arc[] = [];
  const bounces: number[] = [];
  let arc = start;
  for (let k = 0; k < 16 && arc.t0 < until; k++) {
    arcs.push(arc);
    if (arc.g === 0) break;
    const vy = arc.v[1];
    const down = (vy + Math.sqrt(vy * vy + 2 * arc.g * (arc.p[1] - floor))) / arc.g;
    const fence = Math.min(
      toFence(arc.p[2], arc.v[2], FENCE.z),
      toFence(arc.p[0], arc.v[0], FENCE.x),
    );
    if (fence > 1e-9 && fence < down) {
      arc = {
        t0: arc.t0 + fence,
        p: along(arc, arc.t0 + fence),
        v: [0, vy - arc.g * fence, 0],
        g: arc.g,
      };
      continue;
    }
    const at = arc.t0 + down;
    const p = along(arc, at);
    bounces.push(at);
    const up = -BOUNCE_ON * (vy - arc.g * down);
    arc =
      up < 0.5
        ? { t0: at, p: [p[0], floor, p[2]], v: [0, 0, 0], g: 0 }
        : { t0: at, p: [p[0], floor, p[2]], v: [arc.v[0] * KH, up, arc.v[2] * KH], g: arc.g };
  }
  return { arcs, bounces };
}

function pathOf(arcs: Arc[], bounces: number[], reach: number, end: number, kv: number): BallPath {
  return {
    reach,
    end,
    bounces,
    kv,
    bounce: bounces.length > 0 ? pointAt(arcs, bounces[0]!) : null,
    at: (t) => pointAt(arcs, Math.min(Math.max(t, 0), end)),
  };
}
function pointAt(arcs: Arc[], t: number): Vec3 {
  let a = arcs[0]!;
  for (const arc of arcs) if (arc.t0 <= t) a = arc;
  return along(a, t);
}

/**
 * A ball from `from` (a racket at contact) to `to` (the next racket at contact), arriving in exactly `flight` s, with
 * one bounce on the way at depth `bounceZ` on the straight line between them (balls fly straight, seen from above).
 * The times before and after the bounce follow from the distances (the court keeps KH of the speed along it); the
 * up-speed the bounce keeps (`kv`) is what puts the ball at the racket's height on time. The ball runs on past `to`
 * for RUN_ON_S (a miss).
 */
export function shotTo(
  from: Vec3,
  to: Vec3,
  bounceZ: number,
  flight: number,
  spin: number,
): BallPath & { kv: number } {
  const g = GRAVITY + spin;
  const f = (bounceZ - from[2]) / (to[2] - from[2]);
  const bounce: Vec3 = [from[0] + (to[0] - from[0]) * f, floor, bounceZ];
  const d1 = Math.hypot(bounce[0] - from[0], bounce[2] - from[2]);
  const d2 = Math.hypot(to[0] - bounce[0], to[2] - bounce[2]);
  const t1 = flight / (1 + d2 / (KH * d1));
  const t2 = flight - t1;
  const v: Vec3 = [
    (bounce[0] - from[0]) / t1,
    (floor - from[1] + (g * t1 * t1) / 2) / t1,
    (bounce[2] - from[2]) / t1,
  ];
  const down = v[1] - g * t1;
  const up = (to[1] - floor + (g * t2 * t2) / 2) / t2;
  const first: Arc = { t0: 0, p: from, v, g };
  const after = runOn({ t0: t1, p: bounce, v: [v[0] * KH, up, v[2] * KH], g }, flight + RUN_ON_S);
  return pathOf(
    [first, ...after.arcs],
    [t1, ...after.bounces],
    flight,
    flight + RUN_ON_S,
    up / -down,
  );
}

/** A ball that lands exactly at `at` (x, z) after `flight` s, then runs on: a winner, an OUT, or Yash's put-away. */
export function toBounce(
  from: Vec3,
  at: readonly [number, number],
  flight: number,
  spin: number,
): BallPath {
  const g = GRAVITY + spin;
  const v: Vec3 = [
    (at[0] - from[0]) / flight,
    (floor - from[1] + (g * flight * flight) / 2) / flight,
    (at[1] - from[2]) / flight,
  ];
  const first: Arc = { t0: 0, p: from, v, g };
  const down = v[1] - g * flight;
  const after = runOn(
    { t0: flight, p: [at[0], floor, at[1]], v: [v[0] * KH, -BOUNCE_ON * down, v[2] * KH], g },
    flight + RUN_ON_S,
  );
  return pathOf(
    [first, ...after.arcs],
    [flight, ...after.bounces],
    flight,
    flight + RUN_ON_S,
    BOUNCE_ON,
  );
}

/** A ball into the net: it meets the net at `at` (x, height) after `flight` s, then drops on the hitter's side. */
export function intoNet(from: Vec3, at: readonly [number, number], flight: number): BallPath {
  const g = GRAVITY + SPIN.rally;
  const v: Vec3 = [
    (at[0] - from[0]) / flight,
    (at[1] - from[1] + (g * flight * flight) / 2) / flight,
    -from[2] / flight,
  ];
  const first: Arc = { t0: 0, p: from, v, g };
  const back = Math.sign(from[2]);
  const drop = runOn(
    {
      t0: flight,
      p: [at[0], at[1], 0],
      v: [0, Math.min(0, v[1] - g * flight) * 0.2, 0.6 * back],
      g,
    },
    flight + RUN_ON_S,
  );
  return pathOf([first, ...drop.arcs], drop.bounces, flight, flight + RUN_ON_S, BOUNCE_ON);
}
