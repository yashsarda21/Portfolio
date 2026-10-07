import { describe, expect, it } from "vitest";
import { createPixels } from "./pixels";

describe("createPixels", () => {
  it("reproduces the artboard's seeded first and last pixel", () => {
    const px = createPixels();
    expect(px).toHaveLength(90);
    // Values from running Intro.dc.html's renderVals() once (seed 7).
    expect(px[0]).toEqual({
      x: 335,
      y: 218,
      dx: -293,
      dy: -57,
      size: 3,
      color: "led",
      delay: 2.89,
    });
    expect(px[89]).toEqual({
      x: 160,
      y: 202,
      dx: -122,
      dy: 75,
      size: 3,
      color: "volt",
      delay: 3.32,
    });
  });

  it("keeps every pixel inside the artboard's ranges, with only the three colour tokens", () => {
    const px = createPixels();
    expect(px.every((p) => p.delay >= 2.85 && p.delay <= 3.35)).toBe(true);
    expect(px.every((p) => p.x >= 60 && p.x <= 620 && p.y >= 162 && p.y <= 262)).toBe(true);
    expect(px.every((p) => p.dx >= -420 && p.dx <= 680 && p.dy >= -150 && p.dy <= 230)).toBe(true);
    expect(new Set(px.map((p) => p.size))).toEqual(new Set([3, 5]));
    expect(new Set(px.map((p) => p.color))).toEqual(new Set(["volt", "led", "warm"]));
  });

  it("is deterministic, and another seed gives another field", () => {
    expect(createPixels()).toEqual(createPixels(7));
    expect(createPixels(8)[0]).not.toEqual(createPixels(7)[0]);
  });
});
