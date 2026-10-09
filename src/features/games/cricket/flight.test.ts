import { describe, expect, it } from "vitest";
import { ballAt, bounceOf } from "./flight";

describe("the ball's flight", () => {
  it("lands a yorker on the drawn bounce, and shorter balls earlier on the pitch", () => {
    expect(bounceOf("stage", "perfect", 0.5)).toEqual({ x: 719, y: 353 });
    // y grows toward the bowler: a larger y is further from the batter.
    expect(bounceOf("stage", "good", 0.4).y).toBeGreaterThan(bounceOf("stage", "perfect", 0.5).y);
    expect(bounceOf("stage", "miss", 0.1).y).toBeGreaterThan(bounceOf("stage", "good", 0.4).y);
  });

  it("a full toss never lands: it goes straight to the bat", () => {
    expect(bounceOf("stage", "miss", 0.95)).toEqual(
      ballAt("stage", bounceOf("stage", "miss", 0.95), 1),
    );
  });

  it("leaves your hand, touches the bounce, and ends at the batter, in each layout", () => {
    for (const layout of ["stage", "column"] as const) {
      const bounce = bounceOf(layout, "perfect", 0.5);
      const start = ballAt(layout, bounce, 0);
      const end = ballAt(layout, bounce, 1);
      expect(start.y).toBeGreaterThan(bounce.y);
      expect(end.y).toBeLessThan(bounce.y);
      expect(ballAt(layout, bounce, 0.7)).toEqual(bounce);
    }
  });
});
