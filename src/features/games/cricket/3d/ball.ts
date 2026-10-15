import { BALL_RADIUS, CONTACT_Z, GRAVITY, RELEASE, ROPE, type Vec3 } from "./field";
import type { Delivery } from "./delivery";
import type { BatShot } from "./director";

export interface Path {
  readonly duration: number;
  at(t: number): Vec3;
}
export interface DeliveryPath extends Path {
  /** Seconds from the release to the bounce; null for a full toss. */
  readonly bounceAt: number | null;
}
export interface ShotPath extends Path {
  /** When it crosses the rope (FOUR) or lands in the stands (SIX); null for a dot. */
  readonly boundaryAt: number | null;
}

/** What the pitch keeps of the ball's speed: up and along. */
export const BOUNCE = { vertical: 0.45, horizontal: 0.9 } as const;
/** A full toss reaches the bat at this height (m). */
export const FULL_TOSS_Y = 0.9;
/** A ground shot: speed off the bat (m/s), slowing (m/s²), and its little hop (m/s up). */
export const GROUND = { speed: 28, decel: 1.5, hop: 1.2 } as const;
/** An aerial shot: launch angle, and how far past the rope it lands (m). */
export const AIR = { angleDeg: 35, intoStands: 12 } as const;
/** A ball dug out: it trickles toward the bowler and stops. */
export const DEAD = { speed: 4, decel: 6, duration: 1.0 } as const;

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
const fall = (y0: number, vy: number, t: number) => y0 + vy * t - (GRAVITY * t * t) / 2;
const clampT = (t: number, d: number) => Math.min(Math.max(t, 0), d);
const rad = (deg: number) => (deg * Math.PI) / 180;

/** The unit (x, z) direction of a bearing: 0 is straight back past the bowler (+z), +90 square on the leg side (+x). */
export const heading = (bearing: number): readonly [number, number] => [
  Math.sin(rad(bearing)),
  Math.cos(rad(bearing)),
];

/** Metres from `from` along `dir` to the rope. */
export function toRope(from: Vec3, dir: readonly [number, number]): number {
  const ox = from[0] - ROPE.centre[0];
  const oz = from[2] - ROPE.centre[2];
  const b = dir[0] * ox + dir[1] * oz;
  const c = ox * ox + oz * oz - ROPE.radius * ROPE.radius;
  return -b + Math.sqrt(b * b - c);
}

/** Seconds a ground shot takes to run `s` metres. */
export const groundTimeAt = (s: number) =>
  (GROUND.speed - Math.sqrt(Math.max(0, GROUND.speed ** 2 - 2 * GROUND.decel * s))) / GROUND.decel;

/** The ball from the hand to `endZ` (default: the bat), pitching at the delivery's length; past the bat it carries on along the same line. */
export function deliveryPath(d: Delivery, endZ = CONTACT_Z): DeliveryPath {
  const v = d.speedKmh / 3.6;
  const [rx, ry, rz] = RELEASE;
  const batX = d.x + d.seam;
  if (d.pitchZ === null) {
    const xAt = (z: number) => lerp(rx, batX, (rz - z) / (rz - CONTACT_Z));
    const toBat = Math.hypot(batX - rx, rz - CONTACT_Z) / v;
    const vy = (FULL_TOSS_Y - ry + (GRAVITY * toBat * toBat) / 2) / toBat;
    const ex = xAt(endZ);
    const T = Math.hypot(ex - rx, rz - endZ) / v;
    return {
      duration: T,
      bounceAt: null,
      at: (t) => {
        const s = clampT(t, T);
        return [lerp(rx, ex, s / T), Math.max(BALL_RADIUS, fall(ry, vy, s)), lerp(rz, endZ, s / T)];
      },
    };
  }
  const pz = d.pitchZ;
  const bx = lerp(rx, d.x, (rz - pz) / (rz - CONTACT_Z));
  const t1 = Math.hypot(bx - rx, rz - pz) / v;
  const vy1 = (BALL_RADIUS - ry + (GRAVITY * t1 * t1) / 2) / t1;
  const vyOut = -(vy1 - GRAVITY * t1) * BOUNCE.vertical;
  const ex = lerp(bx, batX, (pz - endZ) / (pz - CONTACT_Z));
  const t2 = Math.hypot(ex - bx, pz - endZ) / (v * BOUNCE.horizontal);
  const T = t1 + t2;
  return {
    duration: T,
    bounceAt: t1,
    at: (t) => {
      const s = clampT(t, T);
      if (s <= t1) return [lerp(rx, bx, s / t1), fall(ry, vy1, s), lerp(rz, pz, s / t1)];
      const u = s - t1;
      return [
        lerp(bx, ex, u / t2),
        Math.max(BALL_RADIUS, fall(BALL_RADIUS, vyOut, u)),
        lerp(pz, endZ, u / t2),
      ];
    },
  };
}

/** The ball off the bat from `from`, along `bearing` (degrees). */
export function shotPath(kind: BatShot, bearing: number, from: Vec3): ShotPath {
  const dir = heading(bearing);
  const along = (s: number, y: number): Vec3 => [from[0] + dir[0] * s, y, from[2] + dir[1] * s];
  if (kind === "dugOut") {
    const stop = DEAD.speed / DEAD.decel;
    return {
      duration: DEAD.duration,
      boundaryAt: null,
      at: (t) => {
        const s = Math.min(clampT(t, DEAD.duration), stop);
        return along(DEAD.speed * s - (DEAD.decel * s * s) / 2, BALL_RADIUS);
      },
    };
  }
  if (kind === "loft" || kind === "pull") {
    const a = rad(AIR.angleDeg);
    const v = Math.sqrt(((toRope(from, dir) + AIR.intoStands) * GRAVITY) / Math.sin(2 * a));
    const vh = v * Math.cos(a);
    const vy = v * Math.sin(a);
    const T = (vy + Math.sqrt(vy * vy + 2 * GRAVITY * from[1])) / GRAVITY;
    return {
      duration: T,
      boundaryAt: T,
      at: (t) => {
        const s = clampT(t, T);
        return along(vh * s, Math.max(BALL_RADIUS, fall(from[1], vy, s)));
      },
    };
  }
  const ropeAt = groundTimeAt(toRope(from, dir));
  const T = ropeAt + 0.5;
  return {
    duration: T,
    boundaryAt: ropeAt,
    at: (t) => {
      const s = clampT(t, T);
      return along(
        GROUND.speed * s - (GROUND.decel * s * s) / 2,
        Math.max(BALL_RADIUS, fall(Math.max(from[1], BALL_RADIUS), GROUND.hop, s)),
      );
    },
  };
}
