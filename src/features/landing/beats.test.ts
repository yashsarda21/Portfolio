import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LANDING_BEATS, bootDelay, landingPace } from "./beats";

afterEach(() => {
  document.documentElement.style.removeProperty("--pace");
  vi.unstubAllGlobals();
});

const motion = (reduced: boolean) =>
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: reduced && q.includes("reduce") }));

describe("LANDING_BEATS", () => {
  it("are Main's delays in seconds, in the order the board lights up", () => {
    expect(LANDING_BEATS).toMatchObject({
      crowd: 0.3,
      coneL: 1.0,
      coneR: 1.5,
      sky: 2.2,
      field: 2.4,
      pitch: 2.6,
      boardHeader: 2.7,
      scan: 2.7,
      name: 3.0,
      title: 3.6,
      boardFooter: 4.0,
      ctas: 4.5,
      comm: 5.2,
      hint: 5.2,
    });
    expect(LANDING_BEATS.banks).toEqual([0.6, 1.1, 1.6, 2.0]);
  });
});

describe("bootDelay", () => {
  it("is the beat as the --d custom property, in seconds", () => {
    expect(bootDelay(LANDING_BEATS.ctas)).toEqual({ "--d": "4.5s" });
  });
});

describe("landingPace", () => {
  it("is 1 on a first visit", () => {
    motion(false);
    expect(landingPace()).toBe(1);
  });
  it("is the page's --pace (.25 on a return visit)", () => {
    motion(false);
    document.documentElement.style.setProperty("--pace", "0.25");
    expect(landingPace()).toBe(0.25);
  });
  it("is 0 under reduced motion, even on a return visit", () => {
    motion(true);
    document.documentElement.style.setProperty("--pace", "0.25");
    expect(landingPace()).toBe(0);
  });
});

describe("the return visit's pace", () => {
  it("is set by the Landing's own CSS (pace.css), not by the design system", () => {
    const css = readFileSync("src/features/landing/pace.css", "utf8");
    expect(css).toMatch(/:root\[data-return-visit\]\s*\{\s*--pace:\s*0?\.25;/);
  });
});
