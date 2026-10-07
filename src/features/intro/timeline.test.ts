import { gsap } from "gsap";
import { afterEach, describe, expect, it, vi } from "vitest";
import { frameAt, framePosition } from "@/lib/sprite";
import { INTRO_BEATS } from "./beats";
import { planLetters } from "./letters";
import { createPixels } from "./pixels";
import type { RigResult } from "./rig";
import { createIntroTimeline, showIntroEndState, type IntroRefs } from "./timeline";

type Full = Required<IntroRefs>;

const el = () => document.createElement("div");
const many = (n: number) => Array.from({ length: n }, el);

/** One element per ref, arrays sized like the board: 4 banks, 2 ghosts, 3 strips, 90 pixels, 10 letters, 7 tagline parts, 2 glints. */
function fullRefs(): Full {
  const letters = many(10);
  "YASH SARDA".split("").forEach((ch, i) => (letters[i]!.textContent = ch));
  return {
    root: el(),
    banks: many(4),
    flares: many(4),
    cones: many(2),
    crowd: el(),
    sky: el(),
    field: el(),
    backlight: el(),
    boardOn: el(),
    boardHit: el(),
    boardHeader: el(),
    scan: el(),
    mover: el(),
    ghosts: many(2),
    trails: el(),
    fig: el(),
    strips: many(3),
    rest: el(),
    shock: el(),
    streak: el(),
    glints: many(2),
    pixels: Array.from({ length: 90 }, () => ({ anchor: el(), dot: el() })),
    letters,
    title: el(),
    titleBar: el(),
    tagline: many(7),
    strip: el(),
    flash: el(),
    welcome: el(),
    cta: el(),
    idle: el(),
    sweep: el(),
  };
}

const D = INTRO_BEATS.desktop;
const M = INTRO_BEATS.mobile;
const ready = Promise.resolve("ready" as RigResult);
/** The factory reads the rig through a promise callback; one microtask lets it see a settled promise. */
const settled = () => Promise.resolve();

const made: gsap.core.Timeline[] = [];
function make(
  refs: IntroRefs,
  tier: "desktop" | "mobile" = "desktop",
  rig: Promise<RigResult> = ready,
  onBeat?: (beat: "comm" | "bank" | "done") => void,
) {
  const tl = createIntroTimeline(gsap, refs, { tier, rig, onBeat });
  tl.pause();
  made.push(tl);
  return tl;
}
afterEach(() => {
  made.splice(0).forEach((tl) => tl.kill());
  vi.useRealTimers();
});

const hidden = (e: HTMLElement) => e.style.visibility === "hidden";
const shown = (e: HTMLElement) => e.style.visibility !== "hidden";
const flat = (r: IntroRefs): HTMLElement[] =>
  Object.values(r)
    .flat()
    .flatMap((v) => (v && "anchor" in v ? [v.anchor, v.dot] : [v]))
    .filter((v): v is HTMLElement => v instanceof HTMLElement);

describe("createIntroTimeline: beats and lengths", () => {
  it.each(["desktop", "mobile"] as const)("%s: every beat is a label at its table time", (tier) => {
    const tl = make(fullRefs(), tier);
    for (const [beat, t] of Object.entries(INTRO_BEATS[tier])) {
      if (!beat.endsWith("Gap")) expect(tl.labels[beat]).toBeCloseTo(t, 3);
    }
    expect(Object.keys(tl.labels).sort()).toEqual(
      Object.keys(INTRO_BEATS[tier])
        .filter((b) => !b.endsWith("Gap"))
        .sort(),
    );
  });

  it("lengths: desktop ~6.4s, mobile ~2s", () => {
    const d = (tier: "desktop" | "mobile") => make(fullRefs(), tier).duration();
    expect(d("desktop")).toBeGreaterThan(6.0);
    expect(d("desktop")).toBeLessThan(6.6);
    expect(d("mobile")).toBeGreaterThan(1.8);
    expect(d("mobile")).toBeLessThan(2.2);
  });

  it("skips tracks whose refs are missing (phone: no mover, strips, pixels)", () => {
    const refs = { ...fullRefs(), mover: undefined, strips: [], pixels: [] };
    expect(() => make(refs, "mobile").progress(1)).not.toThrow();
  });

  it.each(["desktop", "mobile"] as const)(
    "%s: with no refs at all it still runs and finishes",
    (tier) => {
      const onBeat = vi.fn();
      const tl = make({}, tier, ready, onBeat);
      expect(() => tl.progress(1)).not.toThrow();
      expect(onBeat).toHaveBeenCalledWith("done");
    },
  );

  it("the phone leaves the stage-only parts alone", () => {
    const refs = fullRefs();
    make(refs, "mobile");
    for (const part of [
      refs.mover,
      refs.fig,
      refs.rest,
      refs.crowd,
      refs.flash,
      ...refs.ghosts,
      ...refs.flares,
    ]) {
      expect(part.style.visibility).toBe("");
    }
    expect(refs.pixels.every((p) => p.anchor.style.visibility === "")).toBe(true);
  });
});

describe("createIntroTimeline: nothing invisible is reachable", () => {
  it("every part that arrives later starts hidden, so it cannot be focused", () => {
    const refs = fullRefs();
    make(refs);
    const later: HTMLElement[] = [
      refs.crowd,
      refs.sky,
      refs.field,
      refs.backlight,
      refs.boardOn,
      refs.boardHit,
      refs.boardHeader,
      refs.scan,
      refs.mover,
      refs.trails,
      refs.shock,
      refs.streak,
      refs.rest,
      refs.strips[1]!,
      refs.strips[2]!,
      refs.title,
      refs.titleBar,
      refs.strip,
      refs.flash,
      refs.welcome,
      refs.cta,
      ...refs.cones,
      ...refs.ghosts,
      ...refs.glints,
      ...refs.flares,
      ...refs.letters,
      ...refs.tagline,
      ...refs.pixels.map((p) => p.anchor),
    ];
    expect(later.filter(shown)).toEqual([]);
  });

  it("the floodlights start dim, not gone", () => {
    const refs = fullRefs();
    make(refs);
    expect(refs.banks.map((b) => b.style.opacity)).toEqual(["0.04", "0.04", "0.04", "0.04"]);
  });

  it("before the CTA beat the CTA is hidden (not focusable), after it it is shown", () => {
    const refs = fullRefs();
    const tl = make(refs);
    tl.seek(D.cta - 0.1);
    expect(refs.cta.style.visibility).toBe("hidden");
    tl.seek(D.cta + 0.01);
    expect(refs.cta.style.visibility).not.toBe("hidden");
  });

  it("ends with every revealed part visible and the CTA reachable", () => {
    const refs = fullRefs();
    make(refs).progress(1);
    expect(refs.cta.style.visibility).not.toBe("hidden");
    expect(refs.letters.every((l) => getComputedStyle(l).opacity === "1")).toBe(true);
    for (const part of [
      refs.crowd,
      refs.sky,
      refs.field,
      refs.boardHeader,
      refs.title,
      refs.strip,
      refs.welcome,
      ...refs.tagline,
    ]) {
      expect(part.style.opacity).toBe("1");
      expect(shown(part)).toBe(true);
    }
  });

  it.each([
    ["desktop", D.cta],
    ["mobile", M.cta],
  ] as const)("%s: the CTA reaches full opacity", (tier, cta) => {
    const refs = fullRefs();
    const tl = make(refs, tier);
    tl.time(cta + 0.7);
    expect(refs.cta.style.opacity).toBe("1");
  });
});

describe("createIntroTimeline: lights, board and entrance", () => {
  it("flickers each bank on its own turn and reports each", () => {
    const onBeat = vi.fn();
    const tl = make(fullRefs(), "desktop", ready, onBeat);
    tl.time(D.banks + 0.001);
    expect(onBeat.mock.calls.filter(([b]) => b === "bank")).toHaveLength(1);
    tl.progress(1);
    expect(onBeat.mock.calls.filter(([b]) => b === "bank")).toHaveLength(4);
  });

  it("a bank follows the artboard's flicker: dim, up at 20%, dipped at 24%, up at 30%", () => {
    const refs = fullRefs();
    const tl = make(refs);
    const o = (at: number) => {
      tl.time(D.banks + at);
      return Number(refs.banks[0]!.style.opacity);
    };
    expect(o(0.1)).toBeCloseTo(0.04, 2);
    expect(o(1.1 * 0.2)).toBeCloseTo(1, 2);
    expect(o(1.1 * 0.24)).toBeCloseTo(0.2, 2);
    expect(o(1.1 * 0.3)).toBeCloseTo(1, 2);
    expect(o(1.1)).toBeCloseTo(1, 2);
  });

  it("the silhouette swings in from the left, turned, and settles", () => {
    const refs = fullRefs();
    const tl = make(refs);
    tl.time(D.entrance + 0.001);
    expect(shown(refs.mover)).toBe(true);
    // The ease leaves the start almost at once, so a millisecond in it is a few px along.
    expect(gsap.getProperty(refs.mover, "x")).toBeLessThan(-1150);
    expect(gsap.getProperty(refs.mover, "rotationY")).toBeGreaterThan(28);
    tl.time(D.entrance + 0.95);
    expect(gsap.getProperty(refs.mover, "x")).toBeCloseTo(0, 3);
    expect(refs.mover.style.filter).toBe("blur(0px)");
  });

  it("the ghosts trail the mover by one ghost gap each, then fade", () => {
    const refs = fullRefs();
    const tl = make(refs);
    tl.time(D.entrance + D.ghostGap - 0.01);
    expect(hidden(refs.ghosts[0]!)).toBe(true);
    tl.time(D.entrance + D.ghostGap + 0.01);
    expect(shown(refs.ghosts[0]!)).toBe(true);
    expect(hidden(refs.ghosts[1]!)).toBe(true);
    tl.time(D.entrance + 2 * D.ghostGap + 0.01);
    expect(shown(refs.ghosts[1]!)).toBe(true);
    tl.progress(1);
    expect(refs.ghosts.every(hidden)).toBe(true);
  });

  it("the board powers up and the scan bar crosses it", () => {
    const refs = fullRefs();
    const tl = make(refs);
    tl.time(D.boardOn + 0.7);
    expect(refs.boardOn.style.opacity).toBe("1");
    tl.time(D.entrance + 0.5);
    expect(shown(refs.scan)).toBe(true);
    expect(gsap.getProperty(refs.scan, "x")).toBeGreaterThan(-120);
    tl.progress(1);
    expect(hidden(refs.scan)).toBe(true);
  });

  it("the lights go on over the silhouette: --lit runs 0 to 1 from the performance beat", () => {
    const refs = fullRefs();
    const tl = make(refs);
    expect(refs.fig.style.getPropertyValue("--lit")).toBe("0");
    tl.time(D.performance + 0.8);
    expect(refs.fig.style.getPropertyValue("--lit")).toBe("1");
  });

  it("the impact glitch slices the figure in five 64 ms holds, then clears", () => {
    const refs = fullRefs();
    const tl = make(refs);
    const at = (dt: number) => {
      tl.time(D.impact + dt);
      return { x: gsap.getProperty(refs.fig, "x"), clip: refs.fig.style.clipPath };
    };
    expect(at(0.03).x).toBe(0);
    expect(at(0.07)).toEqual({ x: -16, clip: "inset(18% 0% 60% 0%)" });
    expect(at(0.13)).toEqual({ x: 12, clip: "inset(55% 0% 15% 0%)" });
    expect(at(0.2).x).toBe(-5);
    expect(at(0.3).x).toBe(0);
    expect(at(0.4).clip).toBe("none");
  });

  it("the board edge flashes volt at the impact: boardHit up, then gone", () => {
    const refs = fullRefs();
    const tl = make(refs);
    tl.time(D.impact + 0.7 * 0.25);
    expect(refs.boardHit.style.opacity).toBe("1");
    tl.time(D.impact + 0.7);
    expect(hidden(refs.boardHit)).toBe(true);
  });

  it("the shockwave fires at the impact and widens as it fades", () => {
    const refs = fullRefs();
    const tl = make(refs);
    expect(hidden(refs.shock)).toBe(true);
    tl.time(D.impact + 0.6 * 0.2);
    expect(shown(refs.shock)).toBe(true);
    tl.time(D.impact + 0.6);
    expect(gsap.getProperty(refs.shock, "scaleX")).toBeCloseTo(3, 2);
    expect(hidden(refs.shock)).toBe(true);
  });
});

describe("createIntroTimeline: the head turn and the rig", () => {
  const strip = (refs: Full, i: number) => refs.strips[i]!;
  /** jsdom writes a bare 0 in a position as 0px. */
  const framePos = (frame: number) => framePosition(frame, 16).replace(/ 0$/, " 0px");

  it("plays the three strips in turn, 16 frames each, swapping at 2.517 s and 3.183 s", async () => {
    const refs = fullRefs();
    const tl = make(refs);
    await settled();
    tl.time(D.performance + 0.01);
    expect(shown(strip(refs, 0))).toBe(true);
    expect(hidden(strip(refs, 1))).toBe(true);
    expect(strip(refs, 0).style.backgroundPosition).toBe(framePos(0));
    // Half way through strip A: frame 8 of 16.
    tl.time(D.performance + 0.667 / 2);
    expect(strip(refs, 0).style.backgroundPosition).toBe(framePos(frameAt(0.5, 16)));
    // Strip B has taken over from A.
    tl.time(D.performance + 0.667 + 0.05);
    expect(hidden(strip(refs, 0))).toBe(true);
    expect(shown(strip(refs, 1))).toBe(true);
    expect(hidden(strip(refs, 2))).toBe(true);
    // Strip C has taken over from B.
    tl.time(D.performance + 1.333 + 0.05);
    expect(hidden(strip(refs, 1))).toBe(true);
    expect(shown(strip(refs, 2))).toBe(true);
  });

  it("ends on the last frame of strip C, with the rest pose still hidden", async () => {
    const refs = fullRefs();
    const tl = make(refs);
    await settled();
    tl.progress(1);
    expect(shown(strip(refs, 2))).toBe(true);
    expect(strip(refs, 2).style.backgroundPosition).toBe(framePos(15));
    expect(refs.strips.slice(0, 2).every(hidden)).toBe(true);
    expect(hidden(refs.rest)).toBe(true);
  });

  it.each(["timeout", "error"] as const)(
    "rig %s: no strip frames, rest pose shown at the performance beat",
    async (result) => {
      const refs = fullRefs();
      const tl = make(refs, "desktop", Promise.resolve(result));
      await settled();
      tl.time(D.performance - 0.01);
      expect(hidden(refs.rest)).toBe(true);
      tl.time(D.performance + 0.01);
      expect(shown(refs.rest)).toBe(true);
      expect(refs.strips.every(hidden)).toBe(true);
      tl.progress(1);
      expect(refs.strips.every(hidden)).toBe(true);
      expect(shown(refs.rest)).toBe(true);
    },
  );

  it("holds at the performance beat while the rig is still loading, and goes on when it is ready", async () => {
    let settle: (r: RigResult) => void = () => {};
    const refs = fullRefs();
    const tl = make(refs, "desktop", new Promise<RigResult>((r) => (settle = r)));
    tl.seek(D.performance - 0.1).play();
    tl.time(D.performance + 0.01);
    expect(tl.paused()).toBe(true);
    settle("ready");
    await settled();
    expect(tl.paused()).toBe(false);
    tl.progress(1);
    expect(shown(refs.strips[2]!)).toBe(true);
    expect(hidden(refs.rest)).toBe(true);
  });

  it("holds for at most 1.5 s, then carries on with the rest pose", () => {
    vi.useFakeTimers();
    const refs = fullRefs();
    const tl = make(refs, "desktop", new Promise<RigResult>(() => {}));
    tl.seek(D.performance - 0.1).play();
    tl.time(D.performance + 0.01);
    expect(tl.paused()).toBe(true);
    vi.advanceTimersByTime(1499);
    expect(tl.paused()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(tl.paused()).toBe(false);
    tl.progress(1);
    expect(refs.strips.every(hidden)).toBe(true);
    expect(shown(refs.rest)).toBe(true);
  });

  it("a rig that is ready too late does not bring the head turn back", async () => {
    vi.useFakeTimers();
    let settle: (r: RigResult) => void = () => {};
    const refs = fullRefs();
    const tl = make(refs, "desktop", new Promise<RigResult>((r) => (settle = r)));
    tl.seek(D.performance - 0.1).play();
    tl.time(D.performance + 0.01);
    vi.advanceTimersByTime(1500);
    settle("ready");
    await vi.advanceTimersByTimeAsync(0);
    tl.progress(1);
    expect(refs.strips.every(hidden)).toBe(true);
    expect(shown(refs.rest)).toBe(true);
  });

  it("does not wait again when it is played again", () => {
    vi.useFakeTimers();
    const tl = make(fullRefs(), "desktop", new Promise<RigResult>(() => {}));
    tl.seek(D.performance - 0.1).play();
    tl.time(D.performance + 0.01);
    vi.advanceTimersByTime(1500);
    expect(tl.paused()).toBe(false);
    tl.restart();
    tl.time(D.performance + 0.01);
    expect(tl.paused()).toBe(false);
  });

  it("goes straight on when the rig is already known", async () => {
    const tl = make(fullRefs());
    await settled();
    tl.time(D.performance + 0.01);
    await settled();
    expect(tl.paused()).toBe(false);
  });

  it("a timeline killed while it waits is left alone when the timer fires", () => {
    vi.useFakeTimers();
    const tl = make(fullRefs(), "desktop", new Promise<RigResult>(() => {}));
    tl.seek(D.performance - 0.1).play();
    tl.time(D.performance + 0.01);
    expect(tl.paused()).toBe(true);
    tl.kill();
    vi.advanceTimersByTime(2000);
    expect(tl.paused()).toBe(true);
  });

  it("the phone never waits for or plays the head turn", () => {
    const refs = fullRefs();
    const tl = make(refs, "mobile", new Promise<RigResult>(() => {}));
    tl.progress(1);
    expect(refs.strips.every((s) => s.style.visibility === "")).toBe(true);
    expect(refs.rest.style.visibility).toBe("");
  });
});

describe("createIntroTimeline: the look, the pixels and the name", () => {
  it("fires the eye-line flare and the glints at the look beat", () => {
    const refs = fullRefs();
    const tl = make(refs);
    expect(hidden(refs.streak) && refs.glints.every(hidden)).toBe(true);
    tl.time(D.look + 0.55 * 0.3);
    expect(refs.streak.style.opacity).toBe("1");
    expect(gsap.getProperty(refs.streak, "scaleX")).toBeCloseTo(1, 2);
    tl.time(D.look + 0.02 + 0.5 * 0.35);
    expect(Number(refs.glints[0]!.style.opacity)).toBeCloseTo(0.85, 2);
    tl.progress(1);
    expect(hidden(refs.streak)).toBe(true);
    expect(refs.glints.every(hidden)).toBe(true);
  });

  it("each of the 90 pixels flies in on its own seeded delay, then shrinks to a dim dot", () => {
    const refs = fullRefs();
    const tl = make(refs);
    const [first] = createPixels();
    const anchor = refs.pixels[0]!.anchor;
    tl.time(first!.delay - 0.01);
    expect(hidden(anchor)).toBe(true);
    tl.time(first!.delay + 0.8 * 0.18);
    expect(Number(anchor.style.opacity)).toBeCloseTo(1, 2);
    tl.progress(1);
    expect(Number(anchor.style.opacity)).toBeCloseTo(0.15, 2);
    expect(gsap.getProperty(anchor, "scale")).toBeCloseTo(0.02, 3);
  });

  it("locks the letters in out of order, 55 ms apart", () => {
    const refs = fullRefs();
    const tl = make(refs);
    const plan = planLetters(10);
    // Letter 1 has order 0 (first); letter 0 has order 3.
    tl.time(D.name + 0.01);
    expect(plan[1]!.order).toBe(0);
    expect(shown(refs.letters[1]!)).toBe(true);
    expect(hidden(refs.letters[0]!)).toBe(true);
    tl.time(D.name + 3 * D.letterGap + 0.01);
    expect(shown(refs.letters[0]!)).toBe(true);
  });

  it("colours each letter through data-lit: in, glow at 55%, done at the end", () => {
    const refs = fullRefs();
    const tl = make(refs);
    const letter = refs.letters[0]!;
    const start = D.name + 3 * D.letterGap;
    expect(letter.hasAttribute("data-lit")).toBe(false);
    tl.time(start + 0.01);
    expect(letter.dataset.lit).toBe("in");
    tl.time(start + 0.7 * 0.55 + 0.01);
    expect(letter.dataset.lit).toBe("glow");
    tl.time(start + 0.7 + 0.01);
    expect(letter.dataset.lit).toBe("done");
    tl.progress(1);
    expect(refs.letters.every((l) => l.dataset.lit === "done")).toBe(true);
  });

  it("each kind enters as the audit says: la from above, lb from below, lc zoomed in", () => {
    const refs = fullRefs();
    const tl = make(refs);
    const first = (i: number) => D.name + planLetters(10)[i]!.order * D.letterGap + 0.001;
    tl.time(first(0));
    // The ease leaves the start almost at once, so these are within a few percent of the from-state.
    expect(gsap.getProperty(refs.letters[0]!, "y")).toBeCloseTo(-60, -1);
    expect(gsap.getProperty(refs.letters[0]!, "scaleY")).toBeCloseTo(1.9, 1);
    tl.time(first(1));
    expect(gsap.getProperty(refs.letters[1]!, "y")).toBeCloseTo(70, -1);
    expect(gsap.getProperty(refs.letters[1]!, "scaleX")).toBeCloseTo(1.6, 1);
    tl.time(first(2));
    expect(gsap.getProperty(refs.letters[2]!, "scale")).toBeCloseTo(2.4, 1);
  });

  it("the name is settled at the end: no blur, no offset", () => {
    const refs = fullRefs();
    make(refs).progress(1);
    for (const l of refs.letters) {
      expect(l.style.filter).toBe("");
      expect(gsap.getProperty(l, "y")).toBe(0);
      expect(gsap.getProperty(l, "scale")).toBe(1);
    }
  });

  it("the phone's name locks in with its own gap, and the phone gets no pixels", () => {
    const refs = fullRefs();
    const tl = make(refs, "mobile");
    tl.time(M.name + 0.01);
    expect(shown(refs.letters[1]!)).toBe(true);
    expect(hidden(refs.letters[0]!)).toBe(true);
    tl.time(M.name + 3 * M.letterGap + 0.01);
    expect(shown(refs.letters[0]!)).toBe(true);
  });
});

describe("createIntroTimeline: title, tagline and finale", () => {
  it("wipes the title in behind a white bar", () => {
    const refs = fullRefs();
    const tl = make(refs);
    expect(hidden(refs.title) && hidden(refs.titleBar)).toBe(true);
    tl.time(D.title + 0.3);
    expect(shown(refs.title)).toBe(true);
    expect(shown(refs.titleBar)).toBe(true);
    expect(refs.title.style.clipPath).not.toBe("inset(0% 100% 0% 0%)");
    expect(gsap.getProperty(refs.titleBar, "x")).toBeGreaterThan(0);
    tl.progress(1);
    expect(refs.title.style.clipPath).toBe("inset(0% 0% 0% 0%)");
    expect(hidden(refs.titleBar)).toBe(true);
  });

  it("ticks the tagline in piece by piece, 60 ms apart", () => {
    const refs = fullRefs();
    const tl = make(refs);
    tl.time(D.tagline + 0.01);
    expect(shown(refs.tagline[0]!)).toBe(true);
    expect(hidden(refs.tagline[1]!)).toBe(true);
    tl.time(D.tagline + 6 * D.taglineGap + 0.01);
    expect(refs.tagline.every(shown)).toBe(true);
  });

  it("flashes the stadium and flares the banks 50 ms apart at the flash beat", () => {
    const refs = fullRefs();
    const tl = make(refs);
    tl.time(D.flash + 0.9 * 0.25);
    expect(Number(refs.flash.style.opacity)).toBeCloseTo(0.55, 2);
    tl.time(D.flash + 3 * 0.05 + 0.3);
    expect(Number(refs.flares[3]!.style.opacity)).toBeCloseTo(1, 2);
    expect(hidden(refs.flares[3]!)).toBe(false);
    tl.progress(1);
    expect(refs.flares.every(hidden)).toBe(true);
    expect(hidden(refs.flash)).toBe(true);
  });

  it("starts the CTA glow at ctaGlow, the breathing and the face sweep at idle, and takes them off on a replay", () => {
    const refs = fullRefs();
    const tl = make(refs);
    tl.time(D.idle - 0.01);
    expect(refs.idle.classList.contains("animate-breathe")).toBe(false);
    tl.time(D.idle + 0.01);
    expect(refs.idle.classList.contains("animate-breathe")).toBe(true);
    expect(refs.sweep.classList.contains("animate-face-sweep")).toBe(false);
    tl.time(D.idle + 0.41);
    expect(refs.sweep.classList.contains("animate-face-sweep")).toBe(true);
    expect(refs.cta.classList.contains("animate-cta-glow")).toBe(false);
    tl.progress(1);
    expect(refs.cta.classList.contains("animate-cta-glow")).toBe(true);
    tl.restart();
    tl.pause();
    tl.progress(0.001);
    expect(refs.cta.classList.contains("animate-cta-glow")).toBe(false);
    expect(refs.idle.classList.contains("animate-breathe")).toBe(false);
    expect(refs.sweep.classList.contains("animate-face-sweep")).toBe(false);
    expect(refs.letters.some((l) => l.hasAttribute("data-lit"))).toBe(false);
  });

  it("the phone has the glow but no idle loops", () => {
    const refs = fullRefs();
    make(refs, "mobile").progress(1);
    expect(refs.cta.classList.contains("animate-cta-glow")).toBe(true);
    expect(refs.idle.classList.contains("animate-breathe")).toBe(false);
    expect(refs.sweep.classList.contains("animate-face-sweep")).toBe(false);
  });
});

describe("createIntroTimeline: callbacks and clean-up", () => {
  it("calls onBeat for comm and done exactly once per play, again after restart", () => {
    const onBeat = vi.fn();
    const tl = make(fullRefs(), "desktop", ready, onBeat);
    const count = (beat: string) => onBeat.mock.calls.filter(([b]) => b === beat).length;
    tl.progress(1);
    expect([count("comm"), count("done"), count("bank")]).toEqual([1, 1, 4]);
    tl.restart();
    tl.pause();
    tl.progress(1);
    expect([count("comm"), count("done"), count("bank")]).toEqual([2, 2, 8]);
  });

  it("calls comm at its beat and done after it", () => {
    const onBeat = vi.fn();
    const tl = make(fullRefs(), "desktop", ready, onBeat);
    tl.time(D.comm - 0.01);
    expect(onBeat).not.toHaveBeenCalledWith("comm");
    tl.time(D.comm + 0.01);
    expect(onBeat).toHaveBeenCalledWith("comm");
    expect(onBeat).not.toHaveBeenCalledWith("done");
    tl.progress(1);
    expect(onBeat).toHaveBeenCalledWith("done");
  });

  it("the phone reports comm at 1.7 s", () => {
    const onBeat = vi.fn();
    const tl = make(fullRefs(), "mobile", ready, onBeat);
    tl.time(M.comm - 0.01);
    expect(onBeat).not.toHaveBeenCalledWith("comm");
    tl.time(M.comm + 0.01);
    expect(onBeat).toHaveBeenCalledWith("comm");
  });

  it("kill() leaves no active tweens on its targets", () => {
    const refs = fullRefs();
    const tl = make(refs);
    expect(gsap.getTweensOf(refs.cta).length).toBeGreaterThan(0);
    expect(gsap.getTweensOf(refs.letters[0]!).length).toBeGreaterThan(0);
    tl.kill();
    expect(gsap.getTweensOf(refs.cta)).toHaveLength(0);
    expect(gsap.getTweensOf(refs.letters)).toHaveLength(0);
    expect(gsap.getTweensOf(refs.pixels.map((p) => p.anchor))).toHaveLength(0);
  });

  it("a restart is idempotent: the same end state, the same pixels, the same letters", async () => {
    const refs = fullRefs();
    const tl = make(refs);
    await settled();
    tl.progress(1);
    const first = flat(refs).map((e) => [
      e.style.visibility,
      e.style.opacity,
      e.getAttribute("data-lit"),
    ]);
    tl.restart();
    tl.pause();
    tl.progress(1);
    expect(
      flat(refs).map((e) => [e.style.visibility, e.style.opacity, e.getAttribute("data-lit")]),
    ).toEqual(first);
  });
});

describe("showIntroEndState", () => {
  it("shows the end state with no idle loop classes", () => {
    const refs = fullRefs();
    showIntroEndState(gsap, refs);
    for (const part of [
      refs.crowd,
      refs.sky,
      refs.field,
      refs.backlight,
      refs.boardOn,
      refs.boardHeader,
      refs.mover,
      refs.rest,
      refs.title,
      refs.strip,
      refs.welcome,
      refs.cta,
      ...refs.cones,
      ...refs.tagline,
      ...refs.letters,
    ]) {
      expect(shown(part)).toBe(true);
      expect(part.style.opacity).toBe("1");
    }
    expect(refs.banks.map((b) => b.style.opacity)).toEqual(["1", "1", "1", "1"]);
    expect(refs.letters.every((l) => l.dataset.lit === "done")).toBe(true);
    expect(refs.title.style.clipPath).toBe("");
    expect(refs.fig.style.getPropertyValue("--lit")).toBe("1");
    expect(gsap.getProperty(refs.mover, "x")).toBe(0);
  });

  it("hides the strips, the effects and the pixels", () => {
    const refs = fullRefs();
    showIntroEndState(gsap, refs);
    for (const part of [
      ...refs.strips,
      ...refs.ghosts,
      ...refs.glints,
      ...refs.flares,
      refs.trails,
      refs.shock,
      refs.streak,
      refs.scan,
      refs.boardHit,
      refs.flash,
      refs.titleBar,
      ...refs.pixels.map((p) => p.anchor),
    ]) {
      expect(hidden(part)).toBe(true);
    }
  });

  it("adds no idle loop classes", () => {
    const refs = fullRefs();
    showIntroEndState(gsap, refs);
    expect(refs.cta.className).toBe("");
    expect(refs.idle.className).toBe("");
    expect(refs.sweep.className).toBe("");
  });

  it("agrees with where the timeline ends, part by part (pixels aside: they end as a dim dot)", async () => {
    const played = fullRefs();
    const tl = make(played, "desktop", Promise.resolve("timeout"));
    await settled();
    tl.progress(1);
    const still = fullRefs();
    showIntroEndState(gsap, still);
    const state = (r: Full) =>
      flat({ ...r, pixels: [] }).map(
        (e) => `${e.style.visibility === "hidden" ? "hidden" : "shown"}/${e.style.opacity}`,
      );
    expect(state(still)).toEqual(state(played));
  });

  it("works for the phone's smaller set of refs, and for none", () => {
    expect(() => showIntroEndState(gsap, {})).not.toThrow();
    const refs = { ...fullRefs(), mover: undefined, strips: [], pixels: [] };
    expect(() => showIntroEndState(gsap, refs)).not.toThrow();
  });
});
