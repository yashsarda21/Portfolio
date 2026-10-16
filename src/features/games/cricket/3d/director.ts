import type { Quality } from "../../engine/types";
import type { CricketCall } from "../referee";
import type { Delivery } from "./delivery";

export type BatShot = "dugOut" | "drive" | "flick" | "pull" | "cut" | "loft";
export type ShotKind = BatShot | "beaten";
export interface Shot {
  kind: ShotKind;
  /** Degrees: 0 straight back past the bowler, + toward the leg side (+x). */
  bearing: number;
}

/** The direction ranges (degrees) a shot is picked inside. */
export const BEARINGS = {
  coverDrive: [-55, -40],
  straight: [6, 14],
  legDrive: [40, 55],
  flick: [45, 60],
  pull: [60, 80],
  /** Square on the off side, through point: a yorker squeezed out on OFF. */
  point: [-95, -75],
  /** Up over point and third man: a short ball cut on OFF. */
  cut: [-110, -80],
  loftOff: [-25, -15],
  loftStraight: [0, 10],
  loftLeg: [15, 25],
} as const satisfies Record<string, readonly [number, number]>;

/**
 * Yash's answer to a ball (spec §4.3). The referee's call never changes; the shot is the one its commentary line
 * describes, and only the exact direction is random. The shot goes to the side the ball was bowled: an OFF ball only
 * ever to the off side (a negative bearing), a LEG ball only to the leg side; a MIDDLE ball may go either way.
 */
export function pickShot(
  { call, q, last }: { call: CricketCall; q: Quality; last: boolean },
  d: Delivery,
  rand: () => number = Math.random,
): Shot {
  const pick = ([a, b]: readonly [number, number]) => a + rand() * (b - a);
  const either = (range: readonly [number, number]) => (rand() < 0.5 ? -1 : 1) * pick(range);
  const byLine = (
    off: readonly [number, number],
    middle: readonly [number, number],
    leg: readonly [number, number],
  ) => (d.line === "off" ? pick(off) : d.line === "leg" ? pick(leg) : either(middle));
  if (call === "dot") return { kind: d.line === "off" ? "beaten" : "dugOut", bearing: 0 };
  if (call === "four") {
    if (last && q === "perfect")
      return d.line === "off"
        ? { kind: "drive", bearing: pick(BEARINGS.point) }
        : { kind: "flick", bearing: pick(BEARINGS.flick) };
    return {
      kind: "drive",
      bearing: byLine(BEARINGS.coverDrive, BEARINGS.straight, BEARINGS.legDrive),
    };
  }
  if (d.pitchZ !== null)
    return d.line === "off"
      ? { kind: "cut", bearing: pick(BEARINGS.cut) }
      : { kind: "pull", bearing: pick(BEARINGS.pull) };
  return {
    kind: "loft",
    bearing: byLine(BEARINGS.loftOff, BEARINGS.loftStraight, BEARINGS.loftLeg),
  };
}
