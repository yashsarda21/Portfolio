import { describe, expect, it } from "vitest";
import { createGameClock, pingPong } from "./clock";

describe("pingPong", () => {
  it("sweeps 0 → 1 → 0", () => {
    expect(pingPong(0, 1100)).toBe(0);
    expect(pingPong(550, 1100)).toBe(0.5);
    expect(pingPong(1100, 1100)).toBe(1);
    expect(pingPong(1650, 1100)).toBe(0.5);
    expect(pingPong(2200, 1100)).toBe(0);
  });

  it("never leaves [0, 1], even for negative time", () => {
    for (const t of [-1, -550, -1100, -1650, -5000]) {
      const v = pingPong(t, 1100);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe("createGameClock", () => {
  it("counts from start, stands still while paused, and continues on resume", () => {
    let t = 1000;
    const clock = createGameClock(() => t);
    expect(clock.elapsed()).toBe(0);
    expect(clock.running()).toBe(false);
    clock.start();
    expect(clock.running()).toBe(true);
    t = 1300;
    expect(clock.elapsed()).toBe(300);
    clock.pause();
    expect(clock.running()).toBe(false);
    t = 9000; // hidden time never counts
    expect(clock.elapsed()).toBe(300);
    clock.resume();
    expect(clock.running()).toBe(true);
    expect(clock.elapsed()).toBe(300);
    t = 9100;
    expect(clock.elapsed()).toBe(400);
  });
});
