import type { GameLayout, Luck } from "../../engine/types";
import type { Side, TennisReturn } from "../referee";
import { intoNet, shotTo, SPIN, toBounce, type BallPath } from "./ball";
import {
  BALL_RADIUS,
  COURT,
  FACE,
  feetFor,
  RECEIVE_SPOT,
  SERVE_SPOT,
  sideSign,
  toWorld,
  YASH_BASE,
  YOUR_BASE,
  type ActorId,
  type Vec3,
} from "./court";
import { courtOf, windowMs, YOUR_CAP, yourPoints, type Court, type MatchState } from "./match";
// Type only: reach.ts imports three, and this file is reached from the first load (ruling R3).
import type { Reach } from "./reach";
import { MISS, ROUTINE, SERVE_CLIP, SWING_LEAD, type Stroke } from "./timing";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

/** The serve bounces this deep in the box. */
export const SERVE_BOUNCE_Z = 5.5;
/** Where you take the serve (|z|): deeper for a slower serve, so it never loops. */
export const serveDepth = (flight: number) => clamp(14.2 + (flight - 1.2) * 1.5, 13.6, 15.0);
/** Where you take Yash's rally ball, and where it bounces (|z|), by its flight. */
export const rallyDepth = (flight: number) => clamp(13.4 + (flight - 1.0) * 3, 13.4, 15.4);
export const rallyBounce = (flight: number) => clamp(9.0 - (flight - 1.0) * 2, 7.6, 9.4);
/** Your return's flight to Yash (s), and its bounce (|z|): a perfect one is quicker and deeper. */
export const RETURN = {
  good: { flight: 1.2, bounce: 9.0 },
  perfect: { flight: 1.05, bounce: 9.6 },
} as const;
/** Yash takes your return here (|z|). */
export const YASH_CONTACT_Z = 13.2;
/** Your last shot and Yash's put-away, to their bounce (s). */
export const FINAL = { good: 0.85, perfect: 0.75, yash: 0.8 } as const;
/** An OUT lands this far clear of the line (m, the ball's edge past the line's outside edge). */
export const OUT_BY = { min: 0.02, max: 0.05 } as const;
/** Into the net: how long it takes, and where it meets the net (height). */
export const NET_SHOT = { flight: 0.45, height: 0.55 } as const;
/** The call comes this long after the point's last ball. */
export const CALL_AFTER_S = 0.9;
/** A player recovers (side shuffle) from this long after his shot, taking this long. */
export const RECOVER = { after: 0.45, takes: 0.9 } as const;
/** Yash starts his recovery this long after the serve (the serve's follow-through is longer than a stroke's). */
const SERVE_RECOVER_AFTER = 0.5;

export interface PointSetup {
  court: Court;
  /** The game's first point (a shorter routine). */
  first: boolean;
  /** You already have 30: your best shot is OUT. */
  capped: boolean;
  /** Each window (s), the layout applied; fixed for the point. */
  windows: { serve: number; rally: number };
  /** The open side at Yash's serve, and at his rally shot. */
  open: [Side, Side];
  /** 6 numbers in [0, 1): placement variety. */
  draws: number[];
}
export interface Decision {
  r: TennisReturn;
  side: Side | null;
  /** s from the point's start. */
  at: number;
}
export interface Decided {
  first?: Decision;
  second?: Decision;
}
export interface Swing {
  by: ActorId;
  kind: "serve" | Stroke | "stretch";
  /** Stretch only: which way, as the screen shows it (your view; ruling R5). */
  side?: Side;
  /** s from the point's start: when the racket is (or would be) at the ball's place. */
  contact: number;
  /** The feet at contact. */
  spot: Vec3;
  meets: boolean;
  miss?: "late" | "early";
}
export interface Flight {
  start: number;
  path: BallPath;
}
export interface Recover {
  by: ActorId;
  start: number;
  end: number;
  to: Vec3;
}
export interface Window {
  opens: number;
  commits: number;
  open: Side;
}
export interface PointScript {
  setup: PointSetup;
  serveClipAt: number;
  tossAt: number;
  serveAt: number;
  windows: Window[];
  swings: Swing[];
  flights: Flight[];
  recovers: Recover[];
  /** Your contacts (your shots that meet the ball), for the hit sound and the phone's buzz. */
  contacts: number[];
  /** When the point's last ball is done and the call comes; null while an input is still to come. */
  end: number | null;
  /** The Hawk-Eye mark of an OUT ball, and when it lands. */
  mark: { at: Vec3; from: number } | null;
}

/** A new point: the court and the windows from the score, the open sides and the placements from `luck`. */
export function setupPoint(s: MatchState, layout: GameLayout, luck: Luck): PointSetup {
  return {
    court: courtOf(s),
    first: s.points.length === 0,
    capped: yourPoints(s) >= YOUR_CAP,
    windows: {
      serve: windowMs("serve", s, layout) / 1000,
      rally: windowMs("rally", s, layout) / 1000,
    },
    open: [luck() < 0.5 ? "left" : "right", luck() < 0.5 ? "left" : "right"],
    draws: Array.from({ length: 6 }, luck),
  };
}

const ground = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[2] - b[2]);
/** The screen side `x` lies on, seen from `from` (+x is your right). */
const sideOf = (x: number, from: Vec3): Side => (x >= from[0] ? "right" : "left");
const other = (side: Side): Side => (side === "left" ? "right" : "left");
/** Where Yash recovers to after a shot: the side away from the one he leaves open. */
const yashCover = (open: Side): Vec3 => [-sideSign(open) * YASH_BASE.cover, 0, YASH_BASE.z];

/** A ball met at (x, z): the stroke, the racket's place at contact, and the feet that put the sweet spot there. */
interface Meet {
  kind: Stroke;
  at: Vec3;
  spot: Vec3;
}
/** The stroke whose feet are nearer where the player stands (`from`) wins; the contact is at that stroke's height. */
function meet(by: ActorId, x: number, z: number, from: Vec3, reach: Reach): Meet {
  const feet = (kind: Stroke) => feetFor([x, 0, z], FACE[by], reach[kind]);
  const fore = feet("forehand");
  const back = feet("backhand");
  const kind: Stroke = ground(fore, from) <= ground(back, from) ? "forehand" : "backhand";
  return { kind, at: [x, reach[kind][1], z], spot: kind === "forehand" ? fore : back };
}
const hit = (by: ActorId, m: Meet, contact: number): Swing => ({
  by,
  kind: m.kind,
  contact,
  spot: m.spot,
  meets: true,
});
/** Your swing that misses: the racket reaches the ball's place after it went by (late) or before it came (early). */
function missed(m: Meet, contact: number, r: TennisReturn): Swing {
  const miss = r.call === "early" ? "early" : "late";
  const at = miss === "early" ? contact - MISS.early : contact + MISS.late;
  return { by: "you", kind: m.kind, contact: at, spot: m.spot, meets: false, miss };
}
const recover = (by: ActorId, shot: number, to: Vec3, after: number = RECOVER.after): Recover => ({
  by,
  start: shot + after,
  end: shot + after + RECOVER.takes,
  to,
});
/** When a flight passes nearest `spot`, seen from above (sampled every 10 ms): the moment a beaten player lunges. */
function nearest(f: Flight, spot: Vec3): number {
  let best = 0;
  let gap = Infinity;
  for (let t = 0; t <= f.path.end; t += 0.01) {
    const d = ground(f.path.at(t), spot);
    if (d < gap) [best, gap] = [t, d];
  }
  return f.start + best;
}
/** A beaten player's lunge from `spot` toward the ball at `ball`, at `contact`. */
const stretch = (by: ActorId, spot: Vec3, ball: Vec3, contact: number): Swing => ({
  by,
  kind: "stretch",
  side: sideOf(ball[0], spot),
  contact,
  spot,
  meets: false,
});
/** A miss that ends the point at once (too late or too early), as opposed to a wrong-side shot that is played. */
const missesTheBall = (r: TennisReturn) => r.q === "miss" && r.call !== "wrong";

/**
 * One point, scripted from the serve routine to the call: where each ball goes, who hits it when, and where each player
 * stands so his racket's sweet spot is exactly on the ball at contact. Times are s from the point's start. Each input
 * not yet `decided` stops the script at your (provisional) swing, with `end` null; deciding it rebuilds the script,
 * and nothing before the decision changes.
 */
export function scriptPoint(setup: PointSetup, decided: Decided, reach: Reach): PointScript {
  const { court, windows: window, open, draws } = setup;
  const swings: Swing[] = [];
  const flights: Flight[] = [];
  const recovers: Recover[] = [];
  const windows: Window[] = [];

  // 1. The routine: bounces, then the serve clip.
  const serveClipAt = (setup.first ? ROUTINE.first : ROUTINE.bounces) * ROUTINE.period;
  const tossAt = serveClipAt + SERVE_CLIP.toss;
  const serveAt = serveClipAt + SERVE_CLIP.contact;
  const done = (end: number | null, mark: PointScript["mark"] = null): PointScript => ({
    setup,
    serveClipAt,
    tossAt,
    serveAt,
    windows,
    swings,
    flights,
    recovers,
    contacts: swings.filter((w) => w.by === "you" && w.meets).map((w) => w.contact),
    end,
    mark,
  });

  // 2. The serve: into the box, to your racket as your window closes plus the swing.
  const flight1 = window.serve + SWING_LEAD;
  const courtSign = court === "deuce" ? 1 : -1;
  const c1x = courtSign * lerp(1.2, 4.6, draws[0]!);
  const c1 = meet("you", c1x, serveDepth(flight1), RECEIVE_SPOT[court], reach);
  const contact1 = serveAt + flight1;
  const racket = toWorld(SERVE_SPOT[court], FACE.yash, reach.serve);
  flights.push({
    start: serveAt,
    path: shotTo(racket, c1.at, SERVE_BOUNCE_Z, flight1, SPIN.serve),
  });
  swings.push({
    by: "yash",
    kind: "serve",
    contact: serveAt,
    spot: SERVE_SPOT[court],
    meets: true,
  });
  const yash1 = yashCover(open[0]);
  recovers.push(recover("yash", serveAt, yash1, SERVE_RECOVER_AFTER));
  windows.push({ opens: serveAt, commits: serveAt + window.serve, open: open[0] });

  // 3–4. Your first input: still to come, or a miss (the serve runs on past you).
  const first = decided.first;
  if (!first) {
    swings.push(hit("you", c1, contact1));
    return done(null);
  }
  if (missesTheBall(first.r)) {
    swings.push(missed(c1, contact1, first.r));
    return done(contact1 + CALL_AFTER_S);
  }

  // 5. Your return (shot 2): to the open side, or (the wrong side) straight to where Yash waits.
  swings.push(hit("you", c1, contact1));
  const wrong1 = first.r.q === "miss";
  const ret = RETURN[first.r.q === "perfect" ? "perfect" : "good"];
  // The wrong side is the one Yash covers.
  const c2x = wrong1
    ? sideSign(other(open[0])) * 1.6
    : sideSign(open[0]) * lerp(2.6, 3.6, draws[2]!);
  const c2 = meet("yash", c2x, -YASH_CONTACT_Z, yash1, reach);
  flights.push({
    start: contact1,
    path: shotTo(c1.at, c2.at, -ret.bounce, ret.flight, SPIN.rally),
  });
  const you1: Vec3 = [Math.sign(c1x) * YOUR_BASE.cover, 0, YOUR_BASE.z];
  recovers.push(recover("you", contact1, you1));
  const yashAt = contact1 + ret.flight;
  swings.push(hit("yash", c2, yashAt));

  if (wrong1) {
    // Yash puts it away to the side you are not on; you stretch for it as it goes by.
    const putAway: Flight = {
      start: yashAt,
      path: toBounce(c2.at, [-Math.sign(you1[0]) * 3.3, 9.2], FINAL.yash, SPIN.rally),
    };
    flights.push(putAway);
    const lunge = nearest(putAway, you1);
    swings.push(stretch("you", you1, putAway.path.at(lunge - yashAt), lunge));
    return done(yashAt + FINAL.yash + CALL_AFTER_S);
  }

  // 6. Yash's rally shot (shot 3): to your racket as your window closes plus the swing.
  const flight3 = window.rally + SWING_LEAD;
  const c3x = sideSign(draws[3]! < 0.5 ? "left" : "right") * lerp(1.0, 3.2, draws[4]!);
  const c3 = meet("you", c3x, rallyDepth(flight3), you1, reach);
  flights.push({
    start: yashAt,
    path: shotTo(c2.at, c3.at, rallyBounce(flight3), flight3, SPIN.rally),
  });
  const yash2 = yashCover(open[1]);
  recovers.push(recover("yash", yashAt, yash2));
  windows.push({ opens: yashAt, commits: yashAt + window.rally, open: open[1] });
  const contact3 = yashAt + flight3;

  // 7. Your second input: still to come, a miss, into the net, or your last shot.
  const second = decided.second;
  if (!second) {
    swings.push(hit("you", c3, contact3));
    return done(null);
  }
  if (missesTheBall(second.r)) {
    swings.push(missed(c3, contact3, second.r));
    return done(contact3 + CALL_AFTER_S);
  }
  swings.push(hit("you", c3, contact3));
  if (second.r.q === "miss") {
    const toward = sideSign(second.side ?? other(open[1]));
    flights.push({
      start: contact3,
      path: intoNet(c3.at, [toward * 1.2, NET_SHOT.height], NET_SHOT.flight),
    });
    return done(contact3 + NET_SHOT.flight + CALL_AFTER_S);
  }

  // Your last shot, to the side Yash left open: in, or (at 30) just OUT past the sideline or the baseline.
  const q = second.r.q;
  const x = sideSign(open[1]);
  const by = lerp(OUT_BY.min, OUT_BY.max, draws[1]!);
  const land: [number, number] = !setup.capped
    ? [x * lerp(2.8, 3.6, draws[5]!), -(q === "perfect" ? 10.6 : 9.8)]
    : draws[5]! < 0.5
      ? [x * (COURT.singles + BALL_RADIUS + by), -8.6]
      : [x * 2.6, -(COURT.half + BALL_RADIUS + by)];
  const last = toBounce(c3.at, land, FINAL[q], SPIN.rally);
  flights.push({ start: contact3, path: last });
  const lands = contact3 + FINAL[q];
  // Yash chases it: a lunge 45 % of the way from where he recovered to toward the bounce, as it lands.
  const bounce: Vec3 = [land[0], 0, land[1]];
  const reachFor: Vec3 = [lerp(yash2[0], land[0], 0.45), 0, lerp(yash2[2], land[1], 0.45)];
  swings.push(stretch("yash", reachFor, bounce, lands));
  return done(lands + CALL_AFTER_S, setup.capped ? { at: last.bounce!, from: lands } : null);
}
