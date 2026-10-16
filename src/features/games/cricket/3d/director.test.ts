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
  it("a perfect ball 3 is flicked off the toes for four; on OFF it is squeezed out through point", () => {
    const s = pickShot({ call: "four", q: "perfect", last: true }, d("leg"), r);
    expect(s.kind).toBe("flick");
    expect(within(s.bearing, BEARINGS.flick)).toBe(true);
    const off = pickShot({ call: "four", q: "perfect", last: true }, d("off"), r);
    expect(off.kind).toBe("drive");
    expect(within(off.bearing, BEARINGS.point)).toBe(true);
  });
  it("a six off a short ball is a pull (a cut on OFF); off a full toss a loft", () => {
    expect(pickShot({ call: "six", q: "miss", last: false }, d("middle", 11), r).kind).toBe("pull");
    const cut = pickShot({ call: "six", q: "miss", last: false }, d("off", 11), r);
    expect(cut.kind).toBe("cut");
    expect(within(cut.bearing, BEARINGS.cut)).toBe(true);
    expect(pickShot({ call: "six", q: "miss", last: true }, d("leg", null), r)).toMatchObject({
      kind: "loft",
    });
  });
  it("the shot goes to the side the ball was bowled: OFF never to leg, LEG never to off", () => {
    const calls = [
      { call: "dot", q: "perfect" },
      { call: "four", q: "good" },
      { call: "four", q: "perfect" },
      { call: "six", q: "miss" },
    ] as const;
    for (const { call, q } of calls)
      for (const last of [false, true])
        for (const pitchZ of [2, 11, null])
          for (let i = 0; i <= 20; i++) {
            const rand = () => i / 20.0001;
            expect(pickShot({ call, q, last }, d("off", pitchZ), rand).bearing).toBeLessThanOrEqual(
              0,
            );
            expect(
              pickShot({ call, q, last }, d("leg", pitchZ), rand).bearing,
            ).toBeGreaterThanOrEqual(0);
          }
  });
});
