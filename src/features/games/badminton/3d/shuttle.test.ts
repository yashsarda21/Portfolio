import { describe, expect, it } from "vitest";
import { COURT } from "./court";
import { flyTo, flyToFloor, heading, netGap, NET_CLEAR, OUT_BY, TURNOVER } from "./shuttle";
import type { Vec3 } from "../../three/track";

const SERVE_FROM: Vec3 = [-0.55, 0.9, -3];
const SERVE_TO: Vec3 = [0.4, 2.55, 5.4];
const speed = (v: Vec3) => Math.hypot(v[0], v[1], v[2]);
const angleDeg = (a: Vec3, b: Vec3) =>
  (Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])) * 180) / Math.PI;
const unit = (v: Vec3): Vec3 => {
  const n = speed(v);
  return [v[0] / n, v[1] / n, v[2] / n];
};

describe("the shuttle's flight", () => {
  it("flyTo reaches its point at its time", () => {
    const p = flyTo(SERVE_FROM, SERVE_TO, 1.5);
    p.at(1.5).forEach((v, i) => expect(Math.abs(v - SERVE_TO[i]!)).toBeLessThan(0.001));
  });

  it("it slows sharply and falls steeply", () => {
    const p = flyTo(SERVE_FROM, SERVE_TO, 1.5);
    expect(speed(p.velocity(1.5))).toBeLessThan(0.35 * speed(p.velocity(0)));
    const [vx, vy, vz] = p.velocity(1.5);
    expect((Math.atan2(-vy, Math.hypot(vx, vz)) * 180) / Math.PI).toBeGreaterThan(60);
  });

  it("a clear clears the net by NET_CLEAR or more", () => {
    // Yash's clear from the back of his court, long to your back line.
    const p = flyToFloor([0.3, 2.5, -4.5], [-0.4, 5.9], 1.5);
    expect(netGap(p)!).toBeGreaterThanOrEqual(NET_CLEAR);
    // A path that stays on one side of the net does not cross it.
    expect(netGap(flyToFloor([0, 2, 1], [0, 5], 1))).toBeNull();
  });

  it("flyToFloor lands where and when it was solved to", () => {
    const p = flyToFloor([0.3, 2.5, -4.5], [-0.4, 5.9], 1.5);
    expect(p.lands).toEqual([-0.4, 0, 5.9]);
    expect(p.end).toBe(1.5);
    expect(Math.abs(p.at(1.5)[1])).toBeLessThan(1e-9);
    expect(p.at(1.5)[0]).toBeCloseTo(-0.4, 9);
    expect(p.at(1.5)[2]).toBeCloseTo(5.9, 9);
  });

  it("flyTo goes on along the same curve to the floor", () => {
    const p = flyTo(SERVE_FROM, SERVE_TO, 1.5);
    expect(p.end).toBeGreaterThan(1.5);
    expect(Math.abs(p.at(p.end)[1])).toBeLessThan(1e-6);
    expect(p.lands![1]).toBe(0);
  });

  it("an OUT lands OUT_BY past the line's outer edge", () => {
    const p = flyToFloor([0.3, 2.5, -4.5], [0.5, COURT.half + OUT_BY.min], 1.5);
    expect(p.lands![2]).toBeGreaterThan(COURT.half);
    expect(p.lands![2] - COURT.half).toBeGreaterThanOrEqual(OUT_BY.min - 1e-9);
    expect(p.lands![2] - COURT.half).toBeLessThanOrEqual(OUT_BY.max);
  });

  it("the shuttle turns cork first within TURNOVER", () => {
    const prev = flyToFloor([-0.4, 2.5, 4.6], [0.2, -5.0], 1.2);
    const next = flyToFloor([0.2, 2.2, -4.9], [-0.3, 5.5], 1.4);
    const back = unit(prev.velocity(prev.end)).map((v) => -v) as unknown as Vec3;
    expect(angleDeg(heading(prev, next, 0), back)).toBeLessThan(0.01);
    expect(angleDeg(heading(prev, next, TURNOVER), unit(next.velocity(TURNOVER)))).toBeLessThan(2);
    expect(speed(heading(prev, next, TURNOVER / 2))).toBeCloseTo(1, 9);
    // With no shuttle before it (a serve) it simply points along its flight.
    expect(angleDeg(heading(null, next, 0), unit(next.velocity(0)))).toBeLessThan(0.01);
  });
});
