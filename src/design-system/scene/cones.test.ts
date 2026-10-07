import { describe, expect, it } from "vitest";
import { CONE_REGIONS, polygonIn } from "./cones";

describe("polygonIn", () => {
  it("maps a clip-path polygon (percent of its box) into fractions of the 1440x900 canvas", () => {
    const poly = polygonIn({ x: 60, y: 70, w: 520, h: 760 }, [
      [0, 0],
      [100, 0],
      [100, 100],
    ]);
    expect(poly[0]).toEqual([60 / 1440, 70 / 900]);
    expect(poly[1]).toEqual([580 / 1440, 70 / 900]);
    expect(poly[2]).toEqual([580 / 1440, 830 / 900]);
  });
});

describe("CONE_REGIONS", () => {
  it("each layout has a left and a right cone, every point inside the canvas", () => {
    for (const layout of ["landing", "intro"] as const) {
      expect(CONE_REGIONS[layout]).toHaveLength(2);
      for (const poly of CONE_REGIONS[layout]) {
        expect(poly).toHaveLength(4);
        for (const [x, y] of poly) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(1);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});
