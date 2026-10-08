import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BREAKPOINT, MEDIA } from "./breakpoints";

const theme = readFileSync("src/design-system/tokens/theme.css", "utf8");
const px = (name: string) =>
  parseFloat(theme.match(new RegExp(`--breakpoint-${name}:\\s*([\\d.]+)rem`))![1]!) * 16;

describe("breakpoints", () => {
  it("are the theme's", () => {
    expect(BREAKPOINT.md).toBe(px("md"));
    expect(BREAKPOINT.lg).toBe(px("lg"));
  });

  it("are written as media queries once", () => {
    expect(MEDIA).toEqual({
      md: "(min-width: 768px)",
      belowMd: "(max-width: 767px)",
      belowLg: "(max-width: 1199px)",
      lg: "(min-width: 1200px)",
    });
  });
});
