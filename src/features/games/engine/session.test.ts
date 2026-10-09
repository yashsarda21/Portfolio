import { beforeEach, describe, expect, it } from "vitest";
import { noteLoss, resetLosses } from "./session";

describe("noteLoss", () => {
  beforeEach(resetLosses);

  it("counts losses at one venue", () => {
    expect(noteLoss("cricket")).toBe(1);
    expect(noteLoss("cricket")).toBe(2);
  });

  it("counts venues apart", () => {
    noteLoss("cricket");
    expect(noteLoss("tennis")).toBe(1);
  });

  it("is cleared by resetLosses", () => {
    noteLoss("cricket");
    resetLosses();
    expect(noteLoss("cricket")).toBe(1);
  });
});
