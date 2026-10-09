import { describe, expect, it } from "vitest";
import { AUTO_RALLY_MS, autoRallyTimes } from "./beats";

describe("autoRallyTimes", () => {
  it("spaces the inputs evenly inside the 3 s", () => {
    expect(autoRallyTimes(3)).toEqual([750, 1500, 2250]);
    expect(autoRallyTimes(4)).toEqual([600, 1200, 1800, 2400]);
  });

  it("resolves every input before the rally ends", () => {
    for (const n of [3, 4])
      for (const t of autoRallyTimes(n)) expect(t).toBeLessThan(AUTO_RALLY_MS);
  });
});
