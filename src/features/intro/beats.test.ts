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

  it("mobile is the 3 s phone cut (D-6: the 2 s cut's beats times 1.5)", () => {
    expect(INTRO_BEATS.mobile).toEqual({
      banks: 0.075,
      bankGap: 0.3,
      boardOn: 0.45,
      boardHeader: 0.45,
      name: 0.9,
      letterGap: 0.045,
      title: 1.65,
      tagline: 1.8,
      taglineGap: 0,
      strip: 1.8,
      welcome: 1.95,
      cta: 2.25,
      comm: 2.55,
      ctaGlow: 3.0,
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

  it("both tiers play the board's own reveal durations (the phone's beats are spread out, not squeezed)", () => {
    expect(INTRO_TEMPO.desktop).toBe(1);
    expect(INTRO_TEMPO.mobile).toBe(1);
  });
});
