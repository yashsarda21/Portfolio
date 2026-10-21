import { describe, expect, it } from "vitest";
import { pickQuality } from "./pick";

describe("pickQuality", () => {
  const judge = (dir: "a" | "b" | null, atMs: number) => pickQuality({ dir, atMs }, "a", 1000);
  it("no pick by the window's end is late; a pick before the hit is early", () => {
    expect(judge(null, 1000)).toEqual({ q: "miss", call: "late" });
    expect(judge("a", 1001)).toEqual({ q: "miss", call: "late" });
    expect(judge("a", -1)).toEqual({ q: "miss", call: "early" });
  });
  it("the other choice in time is wrong; the lit one is perfect in the first 40 %, then good", () => {
    expect(judge("b", 200)).toEqual({ q: "miss", call: "wrong" });
    expect(judge("a", 400)).toEqual({ q: "perfect", call: "perfect" });
    expect(judge("a", 401)).toEqual({ q: "good", call: "good" });
  });
});
