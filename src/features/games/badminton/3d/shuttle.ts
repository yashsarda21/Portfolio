import { clamp, smooth } from "../../three/geometry";
import type { Vec3 } from "../../three/track";
import { GRAVITY, netHeightAt } from "./court";

/**
 * How fast the air takes the shuttle's speed (s): the drag is in proportion to speed, so it shoots off the racket,
 * slows sharply and falls almost straight down (a speed of about g·τ ≈ 6.4 m/s at most when falling).
 */
export const TAU = 0.65;
/** Every shot clears the net tape by at least this (m), except the net shot. */
export const NET_CLEAR = 0.1;
/** The net shot may skim the tape by this much (m). */
export const NET_SKIM = 0.03;
/** An OUT lands this far (m) past the outer edge of the line. */
export const OUT_BY = { min: 0.02, max: 0.05 } as const;
/** How long (s) a shuttle takes to turn cork first after a hit. */
export const TURNOVER = 0.06;
/** The real shuttle (m): the cork's radius and the skirt's radius, and its length. */
export const SHUTTLE = { length: 0.085, cork: 0.0135, skirt: 0.0325 } as const;
/** How much bigger than real it is drawn, so it reads on a phone. */
export const DRAWN = 1.6;

export interface ShuttlePath {
  /** When it reaches the floor (s from the hit); the shuttle is clamped to [0, end]. */
  readonly end: number;
  /** Where the shuttle is `t` s after the hit. */
  at(t: number): Vec3;
  /** Which way and how fast it is going (m/s) `t` s after the hit. */
  velocity(t: number): Vec3;
  /** Where it meets the floor (y = 0). */
  readonly lands: Vec3 | null;
}

/** The farthest (s) we look for the floor. A falling shuttle reaches it in a few seconds at most. */
const LONGEST = 30;

/**
 * Gravity and a drag in proportion to speed have a closed form, so a shuttle's place is a pure function of time. With
 * `k = 1 − e^(−t/τ)`: x = x0 + vx·τ·k, and y = y0 + (vy + g·τ)·τ·k − g·τ·t (z as x).
 */
function curve(from: Vec3, v: Vec3, end: number, lands: Vec3 | null): ShuttlePath {
  const g = GRAVITY;
  const clampT = (t: number) => clamp(t, 0, end);
  return {
    end,
    lands,
    at(t) {
      const s = clampT(t);
      const k = 1 - Math.exp(-s / TAU);
      return [
        from[0] + v[0] * TAU * k,
        from[1] + (v[1] + g * TAU) * TAU * k - g * TAU * s,
        from[2] + v[2] * TAU * k,
      ];
    },
    velocity(t) {
      const e = Math.exp(-clampT(t) / TAU);
      return [v[0] * e, (v[1] + g * TAU) * e - g * TAU, v[2] * e];
    },
  };
}

/** The start velocity that puts the shuttle at `to` at time `flight`. */
function launch(from: Vec3, to: Vec3, flight: number): Vec3 {
  const tk = TAU * (1 - Math.exp(-flight / TAU));
  return [
    (to[0] - from[0]) / tk,
    (to[1] - from[1] + GRAVITY * TAU * flight) / tk - GRAVITY * TAU,
    (to[2] - from[2]) / tk,
  ];
}

/**
 * A shuttle from `from` that passes through `to` at `flight` s, then goes on along the same curve to the floor (`end`
 * is when it lands there). The floor time is found once, here, by halving; every frame after is plain arithmetic.
 */
export function flyTo(from: Vec3, to: Vec3, flight: number): ShuttlePath {
  const v = launch(from, to, flight);
  const open = curve(from, v, LONGEST, null);
  if (open.at(flight)[1] <= 0) return curve(from, v, flight, open.at(flight));
  return toFloor(from, v, flight);
}

/** The shuttle from `from` at speed `v`, on to the floor; it is still up `after` s in. */
function toFloor(from: Vec3, v: Vec3, after: number): ShuttlePath {
  const open = curve(from, v, LONGEST, null);
  let lo = after;
  let hi = LONGEST;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (open.at(mid)[1] > 0) lo = mid;
    else hi = mid;
  }
  const end = (lo + hi) / 2;
  const [x, , z] = open.at(end);
  return curve(from, v, end, [x, 0, z]);
}

/** How fast (m/s) a shuttle that hits the net drops back off the mesh, toward the side it came from. */
export const OFF_THE_NET = 0.5;
/**
 * A shuttle that has hit the net at `at` (z = 0): the mesh takes its pace and it drops to the floor, a little back
 * toward `side` (+1 your side, −1 his).
 */
export const offTheNet = (at: Vec3, side: 1 | -1): ShuttlePath =>
  toFloor(at, [0, 0, side * OFF_THE_NET], 0);

/** A shuttle from `from` that lands at `land` (x, z) at `flight` s: a clear, a drop, an OUT, or Yash's put-away. */
export function flyToFloor(
  from: Vec3,
  land: readonly [x: number, z: number],
  flight: number,
): ShuttlePath {
  const to: Vec3 = [land[0], 0, land[1]];
  return curve(from, launch(from, to, flight), flight, to);
}

/**
 * How high the shuttle's centre is above the tape where it crosses the net (z = 0), or null if it never does. z only
 * ever goes one way, so the crossing is found by halving.
 */
export function netGap(path: ShuttlePath): number | null {
  const start = path.at(0)[2];
  if (Math.sign(start) === Math.sign(path.at(path.end)[2]) || start === 0) return null;
  let lo = 0;
  let hi = path.end;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (Math.sign(path.at(mid)[2]) === Math.sign(start)) lo = mid;
    else hi = mid;
  }
  const [x, y] = path.at((lo + hi) / 2);
  return y - netHeightAt(x);
}

const unit = (v: Vec3): Vec3 => {
  const n = Math.hypot(v[0], v[1], v[2]);
  return n < 1e-9 ? [0, 0, 1] : [v[0] / n, v[1] / n, v[2] / n];
};
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
/** `v` turned by `angle` (radians) about the unit axis `axis` (Rodrigues' formula). */
function turn(v: Vec3, axis: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const k = cross(axis, v);
  const d = dot(axis, v) * (1 - c);
  return [
    v[0] * c + k[0] * s + axis[0] * d,
    v[1] * c + k[1] * s + axis[1] * d,
    v[2] * c + k[2] * s + axis[2] * d,
  ];
}
/** Two directions closer than this to opposite (sin of the gap) have no one way round between them. */
const OPPOSITE = Math.sin((10 * Math.PI) / 180);

/**
 * The cork's direction (a unit vector) `t` s into `path`. The shuttle arrives cork first, so right after a hit the
 * cork still points along `prev`'s direction at its end; it then flips round to the new flight's direction over
 * TURNOVER, on an ease. The flip is the short way round, except when the two are (nearly) opposite, which is the usual
 * case: then it flips over the top, about the horizontal axis across the new flight, so it is the same way every time.
 * With no `prev` (a serve) it is just the flight's direction.
 *
 * `prev` must end at the hit: the flip starts from `prev.velocity(prev.end)`. A scripted flight runs on to the floor
 * past the racket that meets it, so callers cut it at the hit first (sequence.ts `until`); passed whole, the cork would
 * snap at the hit to the way it would have met the floor.
 */
export function heading(prev: ShuttlePath | null, path: ShuttlePath, t: number): Vec3 {
  const now = unit(path.velocity(t));
  if (prev === null || t >= TURNOVER) return now;
  const was = unit(prev.velocity(prev.end));
  const f = smooth(t / TURNOVER);
  const axis = cross(was, now);
  const sine = Math.hypot(axis[0], axis[1], axis[2]);
  const angle = Math.atan2(sine, dot(was, now));
  if (dot(was, now) >= 0 || sine >= OPPOSITE) {
    if (sine < 1e-9) return now;
    return turn(was, [axis[0] / sine, axis[1] / sine, axis[2] / sine], angle * f);
  }
  const ground = unit([now[0], 0, now[2]]);
  let across = unit([ground[2], 0, -ground[0]]);
  if (turn(was, across, Math.PI / 2)[1] < 0) across = [-across[0], 0, -across[2]];
  const flipped = turn(was, across, angle * f);
  // The axis is a little off the plane of the two, so close the small gap as it ends.
  const close = f * f;
  const end = turn(was, across, angle);
  return unit([
    flipped[0] + close * (now[0] - end[0]),
    flipped[1] + close * (now[1] - end[1]),
    flipped[2] + close * (now[2] - end[2]),
  ]);
}
