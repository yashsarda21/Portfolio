import { describe, expect, it } from "vitest";
import { returnAt, returnPath, serveDrawn } from "./flight";

describe("returnAt", () => {
  it("runs from the receiver to the middle of the picked zone", () => {
    expect(returnAt("left", 0)).toEqual({ x: 560, y: 790 });
    expect(returnAt("left", 1)).toEqual({ x: 646, y: 376 });
    expect(returnAt("right", 1)).toEqual({ x: 795, y: 376 });
  });

  it("is on the line the tracer draws: the middle of the curve is its control halfway", () => {
    // For a quadratic, B(.5) = (P0 + 2 P1 + P2) / 4.
    expect(returnAt("right", 0.5)).toEqual({
      x: (560 + 2 * 710 + 795) / 4,
      y: (790 + 2 * 560 + 376) / 4,
    });
    expect(returnPath("right")).toBe("M560 790 Q 710 560 795 376");
  });
});

describe("serveDrawn", () => {
  it("is nothing before the hit and the whole line once the window is over", () => {
    expect(serveDrawn(500, null, 900)).toBe(0);
    expect(serveDrawn(500, 800, 900)).toBe(0);
    expect(serveDrawn(1250, 800, 900)).toBe(0.5);
    expect(serveDrawn(5000, 800, 900)).toBe(1);
  });
});
