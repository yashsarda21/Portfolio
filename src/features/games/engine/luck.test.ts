import { describe, expect, it, vi } from "vitest";
import { luckyWin, winChance } from "./luck";

describe("luckyWin", () => {
  it("does not roll unless the streak is perfect", () => {
    const luck = vi.fn(() => 0);
    expect(luckyWin(false, luck)).toBe(false);
    expect(luck).not.toHaveBeenCalled();
  });

  it("wins under 12 % and loses at 12 %", () => {
    expect(luckyWin(true, () => 0.11)).toBe(true);
    expect(luckyWin(true, () => 0.12)).toBe(false);
  });
});

describe("winChance", () => {
  it("is the perfect rate to the power of the inputs, times 12 %", () => {
    expect(winChance(1, 3)).toBe(0.12);
  });

  it("is about 1 % for a player perfect on 8 % of overs", () => {
    expect(winChance(0.08 ** (1 / 3), 3)).toBeCloseTo(0.0096, 4);
  });
});
