import { describe, expect, it } from "vitest";
import { BALL_RADIUS, CONTACT_Z, HOME, KEEPER_TAKE, LINE_X, RELEASE, ROPE } from "./field";
import { planDelivery, type Delivery } from "./delivery";
import { beatenPath, deliveryPath, shotPath } from "./ball";

const ball = (over: Partial<Delivery> = {}): Delivery => ({
  speedKmh: 140,
  pitchZ: 2,
  x: 0,
  seam: 0,
  line: "middle",
  ...over,
});
const fromRope = (p: readonly number[]) =>
  Math.hypot(p[0]! - ROPE.centre[0], p[2]! - ROPE.centre[2]);

describe("deliveryPath", () => {
  it("leaves the hand, pitches where planned, and meets the bat", () => {
    const path = deliveryPath(ball({ pitchZ: 6, seam: 0.05 }));
    expect(path.at(0)).toEqual(RELEASE);
    const bounce = path.at(path.bounceAt!);
    expect(bounce[1]).toBeCloseTo(BALL_RADIUS, 3);
    expect(bounce[2]).toBeCloseTo(6, 3);
    const bat = path.at(path.duration);
    expect(bat[2]).toBeCloseTo(CONTACT_Z, 3);
    expect(bat[0]).toBeCloseTo(0.05, 3);
  });
  it("takes about half a second at 120 to 145 km/h", () => {
    for (const speedKmh of [120, 145]) {
      const d = deliveryPath(ball({ speedKmh })).duration;
      expect(d).toBeGreaterThan(0.4);
      expect(d).toBeLessThan(0.7);
    }
  });
  it("a full toss never comes below knee height before the bat", () => {
    const path = deliveryPath(ball({ pitchZ: null }));
    expect(path.bounceAt).toBeNull();
    for (let t = 0; t <= path.duration; t += 0.02) expect(path.at(t)[1]).toBeGreaterThan(0.5);
  });
  it("leaves from the hand it is given", () => {
    const hand = [0.4, 1.98, 25] as const;
    expect(deliveryPath(ball(), hand).at(0)).toEqual(hand);
  });
});

describe("beatenPath (review I1)", () => {
  // Off stump's outer edge, plus the ball as drawn (three times its radius).
  const CLEAR = 0.132 + 3 * BALL_RADIUS;
  /** The x where the path crosses z, found along its time. */
  const xAtZ = (path: ReturnType<typeof beatenPath>, z: number) => {
    let t = path.batAt;
    while (t < path.duration && path.at(t)[2] > z) t += 0.0005;
    return path.at(t)[0];
  };
  it("passes outside off stump, never through the stumps, and ends in the keeper's gloves, for every random value", () => {
    for (const quality of ["perfect", "good", "miss"] as const)
      for (const p of [0.2, 0.5, 0.62])
        for (let i = 0; i <= 50; i++) {
          let n = 0;
          const rand = () => [i / 50, 1 - i / 50, ((i * 7) % 50) / 50][n++ % 3]!;
          const d = planDelivery({ quality, p, line: "off" }, rand);
          const path = beatenPath(d);
          expect(path.at(path.batAt)[2]).toBeCloseTo(CONTACT_Z, 3);
          expect(Math.abs(xAtZ(path, 0))).toBeGreaterThan(CLEAR);
          expect(xAtZ(path, 0)).toBeLessThan(0); // the off side
          const end = path.at(path.duration);
          expect(Math.hypot(end[0] - HOME.keeper[0], end[2] - KEEPER_TAKE[2])).toBeLessThan(0.3);
          expect(
            Math.hypot(end[0] - KEEPER_TAKE[0], end[1] - KEEPER_TAKE[1], end[2] - KEEPER_TAKE[2]),
          ).toBeLessThan(0.05);
        }
  });
  it("a perfect ball has no seam: it is exactly on the OFF line at the bat", () => {
    const d = planDelivery({ quality: "perfect", p: 0.5, line: "off" }, () => 0.99);
    expect(d.seam).toBe(0);
    expect(beatenPath(d).at(beatenPath(d).batAt)[0]).toBeCloseTo(LINE_X.off, 3);
  });
});

describe("shotPath", () => {
  const from = [0, 0.4, CONTACT_Z] as const;
  it("a drive stays on the ground and crosses the rope", () => {
    const path = shotPath("drive", -45, from);
    for (let t = 0; t <= path.duration; t += 0.05) expect(path.at(t)[1]).toBeLessThan(0.5);
    expect(fromRope(path.at(path.boundaryAt!))).toBeCloseTo(ROPE.radius, 1);
    expect(fromRope(path.at(path.duration))).toBeGreaterThan(ROPE.radius);
  });
  it("a loft and a pull climb high and land beyond the rope", () => {
    for (const [kind, bearing] of [
      ["loft", 0],
      ["pull", 70],
    ] as const) {
      const path = shotPath(kind, bearing, from);
      let top = 0;
      for (let t = 0; t <= path.duration; t += 0.05) top = Math.max(top, path.at(t)[1]);
      expect(top).toBeGreaterThan(12);
      expect(fromRope(path.at(path.duration))).toBeGreaterThan(ROPE.radius + 5);
    }
  });
  it("a dug-out ball dies within two metres", () => {
    const path = shotPath("dugOut", 0, from);
    expect(path.boundaryAt).toBeNull();
    const end = path.at(path.duration);
    expect(Math.hypot(end[0] - from[0], end[2] - from[2])).toBeLessThan(2);
  });
});
