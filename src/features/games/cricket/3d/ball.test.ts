import { describe, expect, it } from "vitest";
import { BALL_RADIUS, CONTACT_Z, RELEASE, ROPE } from "./field";
import type { Delivery } from "./delivery";
import { deliveryPath, shotPath } from "./ball";

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
  it("carries on past the bat to the keeper when asked", () => {
    const path = deliveryPath(ball({ x: -0.15 }), -12.4);
    expect(path.at(path.duration)[2]).toBeCloseTo(-12.4, 3);
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
