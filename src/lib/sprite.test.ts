import { expect, it } from "vitest";
import { frameAt, framePosition } from "./sprite";

it("steps(16, jump-none): 16 equal holds from frame 0 to 15", () => {
  expect(frameAt(0, 16)).toBe(0);
  expect(frameAt(1 / 16 - 1e-9, 16)).toBe(0);
  expect(frameAt(1 / 16, 16)).toBe(1);
  expect(frameAt(0.999, 16)).toBe(15);
  expect(frameAt(1, 16)).toBe(15);
});

it("frame 15 of 16 is the strip's end (-8400px at 560px frames = 100%)", () => {
  expect(framePosition(15, 16)).toBe("100% 0");
  expect(framePosition(0, 16)).toBe("0% 0");
});
