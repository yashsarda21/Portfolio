import { describe, expect, it } from "vitest";
import { BEARINGS, pickShot } from "./director";
import type { Delivery } from "./delivery";

const d = (line: Delivery["line"], pitchZ: number | null = 2): Delivery => ({
  speedKmh: 140,
  pitchZ,
  x: 0,
  seam: 0,
  line,
});
const r = () => 0.5;
const within = (v: number, [a, b]: readonly [number, number]) => v >= a && v <= b;

describe("pickShot (spec §4.3: what you see matches the commentary)", () => {
  it("a dot on an OFF line is beaten; on MIDDLE or LEG it is dug out", () => {
    expect(pickShot({ call: "dot", q: "perfect", last: false }, d("off"), r).kind).toBe("beaten");
    expect(pickShot({ call: "dot", q: "perfect", last: false }, d("middle"), r).kind).toBe(
      "dugOut",
    );
    expect(pickShot({ call: "dot", q: "perfect", last: false }, d("leg"), r).kind).toBe("dugOut");
  });
  it("a four is a drive whose direction fits the line", () => {
    const off = pickShot({ call: "four", q: "good", last: false }, d("off"), r);
    const leg = pickShot({ call: "four", q: "good", last: false }, d("leg"), r);
    const mid = pickShot({ call: "four", q: "good", last: false }, d("middle"), r);
    expect(off.kind).toBe("drive");
    expect(within(off.bearing, BEARINGS.coverDrive)).toBe(true);
    expect(within(leg.bearing, BEARINGS.legDrive)).toBe(true);
    expect(within(Math.abs(mid.bearing), BEARINGS.straight)).toBe(true);
  });
  it("a perfect ball 3 is flicked off the toes for four", () => {
    const s = pickShot({ call: "four", q: "perfect", last: true }, d("off"), r);
    expect(s.kind).toBe("flick");
    expect(within(s.bearing, BEARINGS.flick)).toBe(true);
  });
  it("a six off a short ball is a pull; off a full toss a loft", () => {
    expect(pickShot({ call: "six", q: "miss", last: false }, d("middle", 11), r).kind).toBe("pull");
    expect(pickShot({ call: "six", q: "miss", last: true }, d("leg", null), r)).toMatchObject({
      kind: "loft",
    });
  });
});
