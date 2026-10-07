import { describe, expect, it } from "vitest";
import { createLetters, planLetters } from "./letters";

describe("createLetters", () => {
  it("uses the board's lock-in order for YASH SARDA", () => {
    expect(createLetters("YASH SARDA").map((l) => l.order)).toEqual([3, 0, 7, 5, 1, 9, 2, 8, 6, 4]);
    expect(createLetters("YASH SARDA").map((l) => l.kind)).toEqual([
      "la",
      "lb",
      "lc",
      "la",
      "lb",
      "lc",
      "la",
      "lb",
      "lc",
      "la",
    ]);
  });

  it("keeps the characters, spaces included", () => {
    expect(
      createLetters("YASH SARDA")
        .map((l) => l.ch)
        .join(""),
    ).toBe("YASH SARDA");
    expect(createLetters("AB")[1]).toEqual({ ch: "B", kind: "lb", order: expect.any(Number) });
  });

  it("gives any other name a full permutation", () => {
    const o = createLetters("ALEXANDRA K").map((l) => l.order);
    expect(o).toHaveLength(11);
    expect([...o].sort((a, b) => a - b)).toEqual([...o.keys()]);
  });

  it("is deterministic and survives edge lengths", () => {
    expect(createLetters("ALEXANDRA K")).toEqual(createLetters("ALEXANDRA K"));
    expect(createLetters("")).toEqual([]);
    expect(createLetters("Q").map((l) => l.order)).toEqual([0]);
  });
});

describe("planLetters", () => {
  it("plans by count, so the timeline needs no text", () => {
    expect(planLetters(10).map((l) => l.order)).toEqual([3, 0, 7, 5, 1, 9, 2, 8, 6, 4]);
    expect(planLetters(4).map((l) => l.kind)).toEqual(["la", "lb", "lc", "la"]);
  });
});
