import { describe, expect, it } from "vitest";
import { ARC, PARKED, shuttleAt, shuttleTransform } from "./flight";

describe("the shuttle's arc", () => {
  it("leaves your ring and lands on Yash's", () => {
    expect(shuttleAt(0)).toEqual(ARC.from);
    expect(shuttleAt(1)).toEqual(ARC.to);
  });

  it("rises to the apex the board draws (y about 247) over the net", () => {
    const ys = Array.from({ length: 101 }, (_, i) => shuttleAt(i / 100).y);
    expect(Math.min(...ys)).toBeGreaterThan(240);
    expect(Math.min(...ys)).toBeLessThan(255);
  });

  it("moves the parked shuttle by the difference, by transform", () => {
    expect(shuttleTransform(0)).toBe(`translate(${560 - PARKED.x}px, ${770 - PARKED.y}px)`);
    expect(shuttleTransform(1)).toBe(`translate(${790 - PARKED.x}px, ${330 - PARKED.y}px)`);
  });

  it("is drawn by the same arc the tracer follows", () => {
    expect(ARC.d).toBe(
      `M${ARC.from.x} ${ARC.from.y} Q ${ARC.via.x} ${ARC.via.y} ${ARC.to.x} ${ARC.to.y}`,
    );
  });
});
