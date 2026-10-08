import { describe, expect, it } from "vitest";
import { seeded } from "./seeded";

describe("seeded", () => {
  it("gives the artboard's sequence for a seed (seed 7)", () => {
    const rnd = seeded(7);
    expect(rnd()).toBeCloseTo(114404 / 233280, 12);
    expect(rnd()).toBeCloseTo(((114404 * 9301 + 49297) % 233280) / 233280, 12);
  });

  it("repeats for the same seed and differs for another", () => {
    const run = (seed: number) => {
      const rnd = seeded(seed);
      return Array.from({ length: 5 }, rnd);
    };
    expect(run(7)).toEqual(run(7));
    expect(run(8)).not.toEqual(run(7));
  });

  it("stays in [0, 1)", () => {
    const rnd = seeded(123);
    for (let i = 0; i < 1000; i++) {
      const n = rnd();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});
