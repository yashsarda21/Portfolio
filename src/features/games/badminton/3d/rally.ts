import type { Judged } from "../../engine/pick";
import type { GameLayout, Luck } from "../../engine/types";
import { FOOTWORK, TURN } from "../../three/footwork";
import { clamp, feetFor, ground, lerp, toWorld } from "../../three/geometry";
import {
  BASE_Z,
  BOX_X,
  boxX,
  CONTACT_Z,
  FACE,
  RECEIVE_Z,
  SERVE_SPOT_Z,
  SET_Z,
  type Vec3,
} from "./court";
import {
  boxOf,
  kindOf,
  outUsed,
  scoreOf,
  serverOf,
  windowMs,
  YOUR_MAX,
  type Dir,
  type MatchState,
  type Player,
  type RallyKind,
} from "./match";
// Type only: reach.ts imports three, and this file is reached from the first load (tennis ruling R3).
import type { Reach } from "./reach";
import { flyTo, flyToFloor, offTheNet, type ShuttlePath } from "./shuttle";
import {
  DIVE_CLIP,
  DIVE_LANDS,
  EARLY_RUN_CAP,
  JUMP_SMASH_CLIP,
  MISS,
  OVERHEAD_CLIP,
  RUN_AFTER,
  SWING_LEAD,
  type Stroke,
} from "./timing";

/** The serve's contact (s from the rally's start): the routine is shorter on the game's first rally. */
export const SERVE_AT = { first: 1.2, rest: 2.0 } as const;
/**
 * How long each shot flies (s), to the racket that meets it or to the floor. Every flight Yash sends to you instead
 * takes your window plus SWING_LEAD. The soft shots fly long, because a shuttle that must fall steeply just over the
 * net has to lose its pace first (the drag, shuttle.ts).
 */
export const FLIGHT = {
  /** Your automatic high serve, to Yash's overhead. */
  serve: 1.6,
  /** Your smash: at Yash, past him into his dive, or into the empty court. */
  smash: 0.8,
  /** Your drop: at Yash by the net, or short of him into his dive. */
  drop: 1.1,
  /** A wrong shot of yours in a smash rally (or a wrong second shot) floating up to Yash's mid-court. */
  float: 1.3,
  /** Your early shot, off the frame and into the net. */
  net: 0.8,
  /** Your automatic weak lift in a read smash rally. */
  lift: 1.4,
  /** Yash's block of your smash, to your lift by the net (a read smash rally). */
  block: 1.6,
} as const;
/** Yash's card shots to the floor (s): `drop` is his overhead drop, `clear` his overhead to the deep corner. */
export const CARD = {
  jumpSmash: 0.5,
  drop: 1.6,
  clear: 1.2,
  net: 1.1,
  block: 1.6,
  lift: 2.0,
  dive: 1.6,
} as const;
/** A player recovers from this long after his shot, taking this long (s). */
export const RECOVER = { after: 0.4, takes: 0.8 } as const;
/** The call comes this long after the rally's last shuttle lands (s). */
export const CALL_AFTER_S = 0.9;
/** How high (m) your early, framed shot meets the net: under the tape, in the mesh. */
const NET_HIT = [1.0, 1.3] as const;
/** You recover this far off the centre line, on the side you last hit from (m). */
const YOUR_BASE_X = 0.3;
/** The cross-court corners Yash's placement aims at (m: across, and depth from the net). */
const CORNER = { x: 2.2, front: [0.6, 1.0], back: [5.9, 6.3] } as const;

export interface RallySetup {
  server: Player;
  box: "right" | "left";
  /** The game's first rally (a shorter routine). */
  first: boolean;
  kind: RallyKind;
  /** You are on 20: a good last shot is OUT, or Yash reads it. */
  on20: boolean;
  outUsed: boolean;
  /** Each window (s), the layout applied; fixed for the rally. */
  windows: [number, number];
  /** The open part at your first pick, and at your second (he is on the floor: the back is open). */
  open: [Dir, Dir];
  /** 8 numbers in [0, 1): placement variety. */
  draws: number[];
}
export interface Decision {
  j: Judged;
  dir: Dir | null;
  /** s from the rally's start. */
  at: number;
}
export interface Decided {
  first?: Decision;
  second?: Decision;
}
export interface Swing {
  by: Player;
  kind: Stroke | "stretch";
  /** s from the rally's start: when the racket is (or would be) at the shuttle's place. */
  contact: number;
  /** The feet at contact (a dive: where he launches from). */
  spot: Vec3;
  /** The heading at contact: FACE, except the dive, turned toward the shuttle. */
  face: number;
  meets: boolean;
  /**
   * Your pick missed (`meets` false): the overhead he was set for, with its racket at the shuttle's place late (just
   * after the shuttle went by) or early (before it came). He always gets to its place (Phase 9, owner 2026-11-07).
   */
  miss?: "late" | "early";
  /** Stretch only: which way, as the screen shows it (+x is your right). */
  side?: "left" | "right";
}
export interface Flight {
  start: number;
  path: ShuttlePath;
}
export interface Window {
  opens: number;
  commits: number;
  open: Dir;
}
export interface Recover {
  by: Player;
  start: number;
  end: number;
  to: Vec3;
}
export interface RallyScript {
  setup: RallySetup;
  /** Your serve's or Yash's serve's contact. */
  serveAt: number;
  windows: Window[];
  swings: Swing[];
  flights: Flight[];
  recovers: Recover[];
  /** Every contact (both players), in order: the hit sound. */
  contacts: number[];
  /** When Yash's dive meets the shuttle, or null when he does not dive. */
  dive: number | null;
  /** When the rally's last shuttle is down and the call comes; null while a pick is still to come. */
  end: number | null;
  /** The Hawk-Eye mark of an OUT shuttle, and when it lands: always null since Phase 9 (no shuttle is drawn out). */
  mark: { at: Vec3; from: number } | null;
}

/** A new rally: the server, the box, the kind and the windows from the score; the open part and the places from `luck`. */
export function setupRally(s: MatchState, layout: GameLayout, luck: Luck): RallySetup {
  const kind = kindOf(s);
  const drawn: Dir = luck() < 0.5 ? "deep" : "short";
  return {
    server: serverOf(s),
    box: boxOf(s),
    first: s.rallies.length === 0,
    kind,
    on20: scoreOf(s).you >= YOUR_MAX,
    outUsed: outUsed(s),
    windows: [windowMs(0, s, layout) / 1000, windowMs(1, s, layout) / 1000],
    open: [
      kind === "smash" || kind === "final" ? "deep" : kind === "dive" ? "short" : drawn,
      "deep",
    ],
    draws: Array.from({ length: 8 }, luck),
  };
}

const smashes = (kind: RallyKind) => kind === "smash" || kind === "final";
const isGood = (j: Judged) => j.q !== "miss";
/** A pick that misses the shuttle (too late or too early), as opposed to a wrong shot that is played. */
const missOf = (j: Judged) => (j.call === "late" || j.call === "early" ? j.call : undefined);
const sideOf = (x: number, from: Vec3): "left" | "right" => (x >= from[0] ? "right" : "left");
/** The heading (0 faces +z) from `a` toward `b` along the ground. */
const headingTo = (a: Vec3, b: Vec3) => Math.atan2(b[0] - a[0], b[2] - a[2]);
/** An early swing comes at least this long before the shuttle (s). */
const EARLY_MIN = 0.03;
/**
 * The soonest your racket can be at the shuttle's place (s): you set off RUN_AFTER after the other's hit and run from
 * `from` to `spot` at no more than EARLY_RUN_CAP, ending SWING_LEAD before contact, with the overhead's prep and the
 * run's turn before that. An early swing comes no sooner, so you always get there (Phase 9, owner 2026-11-07).
 */
const soonest = (after: number, from: Vec3, spot: Vec3) =>
  after +
  RUN_AFTER +
  Math.max(
    OVERHEAD_CLIP.contact + TURN.out + 1e-3,
    SWING_LEAD + ground(from, spot) / EARLY_RUN_CAP,
  );
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

/**
 * One rally, scripted from the routine to the call: where each shuttle goes, who hits it when, and where each player
 * stands so his racket's sweet spot is exactly on the shuttle at contact. Times are s from the rally's start. A pick
 * not yet `decided` stops the script at your (provisional) swing, with `end` null; deciding it rebuilds the script,
 * and nothing before the decision changes.
 */
export function scriptRally(setup: RallySetup, decided: Decided, reach: Reach): RallyScript {
  const { kind, windows: window, open, draws } = setup;
  const d = (i: number) => draws[i]!;
  const swings: Swing[] = [];
  const flights: Flight[] = [];
  const recovers: Recover[] = [];
  const windows: Window[] = [];
  let dive: number | null = null;
  const serveAt = setup.first ? SERVE_AT.first : SERVE_AT.rest;
  const done = (end: number | null): RallyScript => ({
    setup,
    serveAt,
    windows,
    swings,
    flights,
    recovers,
    contacts: swings.filter((w) => w.meets).map((w) => w.contact),
    dive,
    end,
    mark: null,
  });

  /** A swing that meets the shuttle at `at` with `kind`: the feet that put the sweet spot there. */
  const hit = (by: Player, k: Stroke, at: Vec3, contact: number, face = FACE[by]): Swing => {
    const w: Swing = { by, kind: k, contact, spot: feetFor(at, face, reach[k]), face, meets: true };
    swings.push(w);
    return w;
  };
  const fly = (start: number, path: ShuttlePath): Flight => {
    const f = { start, path };
    flights.push(f);
    return f;
  };
  const recover = (by: Player, shot: number, to: Vec3) =>
    recovers.push({
      by,
      start: shot + RECOVER.after,
      end: shot + RECOVER.after + RECOVER.takes,
      to,
    });
  /** The end of a rally Yash wins: you stretch for his last shot as it goes by, and the call follows its landing. */
  const beaten = (last: Flight): RallyScript => {
    const lunge = nearest(last, you);
    const at = last.path.at(lunge - last.start);
    swings.push({
      by: "you",
      kind: "stretch",
      contact: lunge,
      spot: you,
      face: FACE.you,
      meets: false,
      side: sideOf(at[0], you),
    });
    return done(last.start + last.path.end + CALL_AFTER_S);
  };

  // 1. The serve, underarm (contact below 1.15 m), high and deep. When you serve, Yash's high clear stands in for his.
  const sign = (p: Player) => boxX(p, setup.box);
  const youX = sign("you") * lerp(0.4, 1.8, d(0));
  const yourAt: Vec3 = [youX, reach.overhead[1], lerp(...CONTACT_Z.overhead, d(1))];
  const setX = (d(2) < 0.5 ? -1 : 1) * lerp(0.3, 0.6, d(3));
  /** Where Yash covers each part from: forward (the back open) or back (the front open). */
  const covers = (part: Dir): Vec3 => [setX, 0, -SET_Z[part]];
  const yashSet = covers(open[0]);
  let opens: number;
  let incoming: Flight;
  if (setup.server === "yash") {
    const spot: Vec3 = [sign("yash") * BOX_X, 0, -SERVE_SPOT_Z];
    swings.push({
      by: "yash",
      kind: "serve",
      contact: serveAt,
      spot,
      face: FACE.yash,
      meets: true,
    });
    opens = serveAt;
    incoming = fly(
      serveAt,
      flyTo(toWorld(spot, FACE.yash, reach.serve), yourAt, window[0] + SWING_LEAD),
    );
  } else {
    const spot: Vec3 = [sign("you") * BOX_X, 0, SERVE_SPOT_Z];
    swings.push({ by: "you", kind: "serve", contact: serveAt, spot, face: FACE.you, meets: true });
    const clearAt: Vec3 = [
      sign("yash") * lerp(0.4, 1.4, d(3)),
      reach.overhead[1],
      -lerp(...CONTACT_Z.overhead, d(1)),
    ];
    fly(serveAt, flyTo(toWorld(spot, FACE.you, reach.serve), clearAt, FLIGHT.serve));
    opens = serveAt + FLIGHT.serve;
    hit("yash", "overhead", clearAt, opens);
    incoming = fly(opens, flyTo(clearAt, yourAt, window[0] + SWING_LEAD));
  }
  recover("yash", opens, yashSet);
  windows.push({ opens, commits: opens + window[0], open: open[0] });
  const contact1 = opens + window[0] + SWING_LEAD;
  /** Where you recover to after each of your shots. */
  const you: Vec3 = [Math.sign(youX) * YOUR_BASE_X, 0, BASE_Z];

  /**
   * Your pick that misses ends the rally at once, his point (owner play-test ruling). You always reach the shuttle
   * (Phase 9, owner 2026-11-07): you stand where the meeting swing plans (`at`, the feet as for a good shot) and swing
   * at its place, late (the shuttle has gone by; the pick is known only at the commit) or early (it has not come), and
   * the racket finds nothing: the shuttle flies on to the floor in your court. `after` is the other's hit, `from` where
   * you stand then.
   */
  const missed = (
    into: Flight,
    at: Vec3,
    contact: number,
    miss: "late" | "early",
    after: number,
    from: Vec3,
  ) => {
    const spot = feetFor(at, FACE.you, reach.overhead);
    const t =
      miss === "late"
        ? contact + MISS.late
        : Math.min(contact - EARLY_MIN, Math.max(contact - MISS.early, soonest(after, from, spot)));
    swings.push({
      by: "you",
      kind: "overhead",
      contact: t,
      spot,
      face: FACE.you,
      meets: false,
      miss,
    });
    return done(into.start + into.path.end + CALL_AFTER_S);
  };

  // 2. Your first pick: still to come.
  const first = decided.first;
  if (!first) {
    hit("you", "overhead", yourAt, contact1);
    return done(null);
  }
  const miss1 = missOf(first.j);
  if (miss1) {
    const from: Vec3 = [sign("you") * BOX_X, 0, setup.server === "yash" ? RECEIVE_Z : SERVE_SPOT_Z];
    return missed(incoming, yourAt, contact1, miss1, opens, from);
  }
  hit("you", "overhead", yourAt, contact1);
  recover("you", contact1, you);
  const ys = Math.sign(youX);

  /** Yash's card shot from `at` (his stroke `k`) to the floor, where the rally's kind puts it. */
  const card = (k: Exclude<Stroke, "serve">, at: Vec3, t: number, face = FACE.yash): Flight => {
    const across = (lo: number, hi: number) => -ys * lerp(lo, hi, d(6));
    const deep = (lo: number, hi: number) => lerp(lo, hi, d(5));
    const placement = k === "block" ? CORNER.front : CORNER.back;
    const land: [number, number] = smashes(kind)
      ? [across(1.2, 2.2), deep(3.8, 5.4)]
      : kind === "drop"
        ? [across(0.6, 2.0), deep(0.4, 1.1)]
        : kind === "dive"
          ? [across(0.5, 2.0), deep(0.3, 0.7)]
          : [-ys * CORNER.x, deep(placement[0], placement[1])];
    const flight = k === "overhead" ? (kind === "drop" ? CARD.drop : CARD.clear) : CARD[k];
    hit("yash", k, at, t, face);
    return fly(t, flyToFloor(at, land, flight));
  };
  /** Where Yash meets a shot floating up to his mid-court with stroke `k`, his feet near (x, z): inside CONTACT_Z.mid. */
  const midAt = (k: Stroke, x: number, z: number): Vec3 => [
    x + reach[k][0],
    reach[k][1],
    clamp(z + reach[k][2], -CONTACT_Z.mid[1], -CONTACT_Z.mid[0]),
  ];
  /** Yash's dive to meet the shuttle at `at`, from `from`, turned toward it. */
  const diveTo = (at: Vec3, from: Vec3, t: number) => {
    dive = t;
    return hit("yash", "dive", at, t, headingTo(from, at));
  };

  const j1 = first.j;
  const dir1 = first.dir ?? open[0];
  // 3. The Data rally: your good drop beats him into the dive; your smash he blocks dead.
  if (kind === "dive") {
    if (j1.call === "wrong") {
      const at = toWorld(covers("short"), FACE.yash, reach.block);
      fly(contact1, flyTo(yourAt, at, FLIGHT.smash));
      return beaten(card("block", at, contact1 + FLIGHT.smash));
    }
    const at: Vec3 = [lerp(-1, 1, d(4)), reach.dive[1], -lerp(1.7, 2.0, d(5))];
    fly(contact1, flyTo(yourAt, at, FLIGHT.drop));
    dive = contact1 + FLIGHT.drop;
    return beaten(card("dive", at, dive, headingTo(yashSet, at)));
  }

  // 4. Wrong: in the smash rallies it floats up to him; otherwise it goes where he waits. A read goes there too.
  const read = setup.on20 && (setup.outUsed || kind === "final");
  if (!isGood(j1) || read) {
    const how: "float" | Dir = !isGood(j1) && smashes(kind) ? "float" : dir1;
    if (how === "float") {
      const k: Stroke = smashes(kind) ? "jumpSmash" : "overhead";
      const at = midAt(k, lerp(-0.8, 0.8, d(4)), -lerp(...CONTACT_Z.mid, d(5)));
      fly(contact1, flyTo(yourAt, at, FLIGHT.float));
      return beaten(card(k, at, contact1 + FLIGHT.float));
    }
    if (how === "short") {
      // Your drop, at him by the net: his tumbling net shot, or (placement) his lift to the deep corner.
      const k: Stroke = kind === "placement" ? "lift" : "net";
      const w = covers("deep");
      const at: Vec3 = [
        w[0] + reach[k][0],
        reach[k][1],
        k === "net" ? -lerp(0.4, 0.6, d(5)) : -lerp(0.9, 1.1, d(5)),
      ];
      fly(contact1, flyTo(yourAt, at, FLIGHT.drop));
      return beaten(card(k, at, contact1 + FLIGHT.drop));
    }
    // Your smash, at him at the back: he blocks it.
    const at = toWorld(covers("short"), FACE.yash, reach.block);
    fly(contact1, flyTo(yourAt, at, FLIGHT.smash));
    const blockAt = contact1 + FLIGHT.smash;
    if (!smashes(kind)) return beaten(card("block", at, blockAt));
    // A read smash rally: his block to the net, your automatic weak lift, his jump smash.
    hit("yash", "block", at, blockAt);
    const liftAt: Vec3 = [ys * lerp(0.5, 1.5, d(4)), reach.lift[1], lerp(1.4, 1.7, d(5))];
    fly(blockAt, flyTo(at, liftAt, FLIGHT.block));
    const lifted = blockAt + FLIGHT.block;
    hit("you", "lift", liftAt, lifted);
    recover("you", lifted, you);
    const smashAt = midAt("jumpSmash", lerp(-0.8, 0.8, d(6)), -lerp(...CONTACT_Z.mid, d(5)));
    fly(lifted, flyTo(liftAt, smashAt, FLIGHT.lift));
    return beaten(card("jumpSmash", smashAt, lifted + FLIGHT.lift));
  }

  // 5. Good: he is stretched. Your drop gets a forward dive, your smash a side dive; his scoop pops it up to you.
  const side = setX < 0 ? 1 : -1;
  const diveAt: Vec3 =
    open[0] === "short"
      ? [lerp(-1, 1, d(4)), reach.dive[1], -lerp(1.7, 2.0, d(5))]
      : [side * lerp(2.0, 2.3, d(4)), reach.dive[1], -lerp(2.8, 3.3, d(5))];
  const toDive = open[0] === "short" ? FLIGHT.drop : FLIGHT.smash;
  fly(contact1, flyTo(yourAt, diveAt, toDive));
  const dived = diveTo(diveAt, yashSet, contact1 + toDive);
  const up = toWorld(dived.spot, dived.face, DIVE_LANDS);
  const yourAt2: Vec3 = [
    ys * lerp(0.3, 1.5, d(4)),
    reach.overhead[1],
    lerp(...CONTACT_Z.mid, d(5)),
  ];
  const scoop = fly(dived.contact, flyTo(diveAt, yourAt2, window[1] + SWING_LEAD));
  windows.push({ opens: dived.contact, commits: dived.contact + window[1], open: open[1] });
  const contact2 = dived.contact + window[1] + SWING_LEAD;

  // 6. Your second pick: still to come, a miss, good (the empty court, or OUT on 20), or wrong (he is up for his card).
  const second = decided.second;
  if (!second) {
    hit("you", "overhead", yourAt2, contact2);
    return done(null);
  }
  const miss2 = missOf(second.j);
  if (miss2) return missed(scoop, yourAt2, contact2, miss2, dived.contact, you);
  hit("you", "overhead", yourAt2, contact2);
  recover("you", contact2, you);
  if (isGood(second.j)) {
    // On 20 your best shot goes into the net: the call is still "out", but it is drawn into the net since Phase 9
    // (owner 2026-11-07), low from your racket and dropping off the mesh on your side.
    if (setup.on20) {
      const net: Vec3 = [yourAt2[0], lerp(...NET_HIT, d(6)), 0];
      fly(contact2, flyTo(yourAt2, net, FLIGHT.net));
      const off = fly(contact2 + FLIGHT.net, offTheNet(net, 1));
      return done(off.start + off.path.end + CALL_AFTER_S);
    }
    const away = diveAt[0] < 0 ? 1 : -1;
    const land: [number, number] = [away * lerp(1.0, 2.0, d(6)), -lerp(5.2, 6.0, d(5))];
    fly(contact2, flyToFloor(yourAt2, land, FLIGHT.smash));
    return done(contact2 + FLIGHT.smash + CALL_AFTER_S);
  }
  // Wrong: your shot floats; he gets up where the dive left him, moves, and plays his card from it.
  const k: Stroke = smashes(kind) ? "jumpSmash" : "overhead";
  const at = midAt(k, up[0], up[2]);
  const move = ground(up, feetFor(at, FACE.yash, reach[k])) / FOOTWORK.sprint;
  const stroke = k === "jumpSmash" ? JUMP_SMASH_CLIP.contact : OVERHEAD_CLIP.contact;
  const ready = dived.contact + DIVE_CLIP.up - DIVE_CLIP.contact + move + stroke;
  const flight = Math.max(FLIGHT.float, ready - contact2);
  fly(contact2, flyTo(yourAt2, at, flight));
  return beaten(card(k, at, contact2 + flight));
}
