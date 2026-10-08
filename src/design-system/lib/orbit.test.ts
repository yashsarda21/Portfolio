import { describe, expect, it } from "vitest";
import { orbitAngle } from "./orbit";

describe("orbitAngle", () => {
  it("is 0 at rest", () => expect(orbitAngle(0, 1000, 15)).toBe(0));
  it("reaches the limit at half the width", () => expect(orbitAngle(500, 1000, 15)).toBe(15));
  it("is proportional in between", () => expect(orbitAngle(-250, 1000, 15)).toBe(-7.5));
  it("never passes the limit", () => expect(orbitAngle(5000, 1000, 15)).toBe(15));
  it("a zero-width plate does not divide by zero", () => expect(orbitAngle(10, 0, 15)).toBe(0));
  it("never returns negative zero", () =>
    expect(Object.is(orbitAngle(-0, 1000, 15), 0)).toBe(true));
});
