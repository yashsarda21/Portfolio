import { describe, expect, it } from "vitest";
import { INTRO_BEATS } from "@/features/intro/beats";
import { LANDING_BEATS } from "@/features/landing/beats";
import { cueEnd, showSchedule } from "./showSound";

const lights = (cues: ReturnType<typeof showSchedule>) =>
  cues.filter((c) => c.sound === "light").map((c) => c.at);
const crowd = (cues: ReturnType<typeof showSchedule>) => cues.filter((c) => c.sound === "crowd");

describe("showSchedule: the Home", () => {
  it("a return visit: the crowd alone, field to name to calls to action, every time scaled by the pace", () => {
    const cues = showSchedule("landing", { pace: 0.25 });
    expect(lights(cues)).toEqual([]);
    expect(crowd(cues)).toEqual([
      { at: 0.6, sound: "crowd", fadeIn: 0.15, holdUntil: 1.125, fadeOut: 0.375 },
    ]);
    expect(crowd(cues)[0]!.at + crowd(cues)[0]!.fadeIn!).toBeCloseTo(LANDING_BEATS.name * 0.25);
  });

  it("at full pace the crowd follows Main's beats: 2.4 s, full at 3.0 s, held to 4.5 s", () => {
    expect(crowd(showSchedule("landing", { pace: 1 }))).toEqual([
      { at: 2.4, sound: "crowd", fadeIn: 0.6, holdUntil: 4.5, fadeOut: 1.5 },
    ]);
  });

  it("reduced motion (pace 0) has no show", () => {
    expect(showSchedule("landing", { pace: 0 })).toEqual([]);
  });
});

describe("showSchedule: the Intro", () => {
  it("desktop: a clunk per bank at banks + i x bankGap; the crowd from the name, full at the flash, faded from the call to action", () => {
    const cues = showSchedule("intro", { tier: "desktop" });
    expect(lights(cues)).toEqual([0.2, 0.45, 0.7, 0.95]);
    expect(crowd(cues)).toEqual([
      { at: 3.1, sound: "crowd", fadeIn: 1.9, holdUntil: 5.7, fadeOut: 1.2 },
    ]);
    const d = INTRO_BEATS.desktop;
    expect(crowd(cues)[0]!.at + crowd(cues)[0]!.fadeIn!).toBeCloseTo(d.flash);
  });

  it("phone: 0.075 + i x 0.3 for the clunks; the crowd from the name, full by the title, faded from the call to action", () => {
    const cues = showSchedule("intro", { tier: "mobile" });
    expect(lights(cues)).toEqual([0.075, 0.375, 0.675, 0.975]);
    expect(crowd(cues)).toEqual([
      { at: 0.9, sound: "crowd", fadeIn: 0.75, holdUntil: 2.25, fadeOut: 1.2 },
    ]);
  });

  it("on the stage every clunk is done before the name appears", () => {
    const cues = showSchedule("intro", { tier: "desktop" });
    expect(Math.max(...lights(cues))).toBeLessThan(crowd(cues)[0]!.at);
  });
});

describe("cueEnd", () => {
  it("is where the crowd's fade ends; the recording (6 s) is long enough for every show", () => {
    const all = [
      ...showSchedule("landing", { pace: 1 }),
      ...showSchedule("intro", { tier: "desktop" }),
      ...showSchedule("intro", { tier: "mobile" }),
    ].filter((c) => c.sound === "crowd");
    for (const cue of all) expect(cueEnd(cue) - cue.at).toBeLessThanOrEqual(6);
    expect(cueEnd(all[0]!)).toBeCloseTo(6.0);
  });
});
