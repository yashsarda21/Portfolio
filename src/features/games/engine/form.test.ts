import { describe, expect, it } from "vitest";
import { perfectShare } from "./form";

describe("perfectShare", () => {
  it("is the share of inputs played perfectly", () => {
    expect(perfectShare([{ q: "perfect" }, { q: "good" }, { q: "miss" }])).toBeCloseTo(1 / 3);
    expect(perfectShare([{ q: "perfect" }, { q: "perfect" }])).toBe(1);
    expect(perfectShare([{ q: "good" }, { q: "miss" }])).toBe(0);
  });
  it("is 0 for no inputs", () => {
    expect(perfectShare([])).toBe(0);
  });
});
