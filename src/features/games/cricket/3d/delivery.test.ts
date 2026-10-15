import { describe, expect, it } from "vitest";
import { LINE_X } from "./field";
import { LENGTH_Z, planDelivery, SPEED_KMH } from "./delivery";

const at = (v: number) => () => v;

describe("planDelivery", () => {
  it("a perfect ball is a yorker on the chosen line, at 142 to 145 km/h", () => {
    const d = planDelivery({ quality: "perfect", p: 0.5, line: "off" }, at(0.5));
    expect(d.pitchZ).toBe(LENGTH_Z.yorker);
    expect(d.x).toBe(LINE_X.off);
    expect(d.speedKmh).toBeGreaterThanOrEqual(142);
    expect(d.speedKmh).toBeLessThanOrEqual(145);
  });
  it("an early miss is short, a late miss is a full toss", () => {
    expect(planDelivery({ quality: "miss", p: 0, line: "middle" }, at(0.5)).pitchZ).toBe(
      LENGTH_Z.short,
    );
    expect(planDelivery({ quality: "miss", p: 1, line: "middle" }, at(0.5)).pitchZ).toBeNull();
  });
  it("a late good ball is fuller than the yorker spot, never past the bat", () => {
    const z = planDelivery({ quality: "good", p: 0.64, line: "leg" }, at(0.5)).pitchZ!;
    expect(z).toBeLessThan(LENGTH_Z.yorker);
    expect(z).toBeGreaterThanOrEqual(LENGTH_Z.fullest);
  });
  it("speeds stay inside their band at both ends of the random source", () => {
    for (const q of ["perfect", "good", "miss"] as const)
      for (const r of [0, 0.999]) {
        const s = planDelivery({ quality: q, p: 0.5, line: "middle" }, at(r)).speedKmh;
        expect(s).toBeGreaterThanOrEqual(SPEED_KMH[q][0]);
        expect(s).toBeLessThanOrEqual(SPEED_KMH[q][1]);
      }
  });
  it("a full toss has no seam", () => {
    expect(planDelivery({ quality: "miss", p: 0.9, line: "off" }, at(0.9)).seam).toBe(0);
  });
});
