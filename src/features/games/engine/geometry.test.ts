import { describe, expect, it } from "vitest";
import { lerp, quad } from "./geometry";

describe("geometry", () => {
  it("lerp runs straight from a to b", () => {
    expect(lerp({ x: 0, y: 10 }, { x: 10, y: 30 }, 0)).toEqual({ x: 0, y: 10 });
    expect(lerp({ x: 0, y: 10 }, { x: 10, y: 30 }, 0.5)).toEqual({ x: 5, y: 20 });
    expect(lerp({ x: 0, y: 10 }, { x: 10, y: 30 }, 1)).toEqual({ x: 10, y: 30 });
  });

  it("quad starts at from, ends at to and bows toward via", () => {
    const [from, via, to] = [
      { x: 0, y: 0 },
      { x: 10, y: 20 },
      { x: 20, y: 0 },
    ];
    expect(quad(from, via, to, 0)).toEqual(from);
    expect(quad(from, via, to, 1)).toEqual(to);
    expect(quad(from, via, to, 0.5)).toEqual({ x: 10, y: 10 });
  });
});
