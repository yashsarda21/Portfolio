import { describe, expect, it } from "vitest";
import { INTRO_BEATS, INTRO_TEMPO, isGap } from "./beats";

describe("INTRO_BEATS", () => {
  it("desktop is the Intro board's delays in seconds", () => {
    expect(INTRO_BEATS.desktop).toEqual({
      crowd: 0.3,
      banks: 0.2,
      bankGap: 0.25,
      coneL: 0.4,
      boardHeader: 0.85,
      boardOn: 0.8,
      sky: 0.9,
      coneR: 0.9,
      entrance: 0.95,
      ghostGap: 0.07,
      field: 1.2,
      backlight: 1.5,
      performance: 1.85,
      impact: 1.88,
      look: 2.78,
      pixels: 2.85,
      name: 3.1,
      letterGap: 0.055,
      idle: 3.9,
      title: 3.95,
      tagline: 4.3,
      taglineGap: 0.06,
      strip: 4.6,
      flash: 5.0,
      welcome: 5.4,
      cta: 5.7,
      comm: 5.9,
      ctaGlow: 6.5,
    });
  });

  it("mobile is the 2 s phone cut", () => {
    expect(INTRO_BEATS.mobile).toEqual({
      banks: 0.05,
      bankGap: 0.2,
      boardOn: 0.3,
      boardHeader: 0.3,
      name: 0.6,
      letterGap: 0.03,
      title: 1.1,
      tagline: 1.2,
      taglineGap: 0,
      strip: 1.2,
      welcome: 1.3,
      cta: 1.5,
      comm: 1.7,
      ctaGlow: 2.0,
    });
  });

  it("the phone only uses beats the stage defines", () => {
    for (const beat of Object.keys(INTRO_BEATS.mobile)) {
      expect(Object.keys(INTRO_BEATS.desktop)).toContain(beat);
    }
  });

  it("isGap tells spacings from beats", () => {
    expect(["bankGap", "ghostGap", "letterGap", "taglineGap"].every(isGap)).toBe(true);
    expect(["banks", "cta", "comm"].some(isGap)).toBe(false);
  });

  it("the stage plays at the board's speed, the phone a little quicker", () => {
    expect(INTRO_TEMPO.desktop).toBe(1);
    expect(INTRO_TEMPO.mobile).toBeLessThan(1);
  });
});
