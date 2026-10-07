import type { gsap as Gsap } from "gsap";
import { EASE } from "@/lib/motion";
import { frameAt, framePosition } from "@/lib/sprite";
import { INTRO_BEATS, INTRO_TEMPO, isGap, type Beat, type IntroTier } from "./beats";
import { planLetters, type LetterKind } from "./letters";
import { createPixels } from "./pixels";
import type { RigResult } from "./rig";

/*
 * The Player Introduction as one GSAP timeline, built from the beat table (beats.ts), never from seconds typed
 * into tweens. It knows nothing about the DOM beyond the elements it is handed (IntroRefs); the screen collects
 * them. GSAP itself is a parameter so it is only ever loaded on demand (spec §9.1).
 *
 * What the screen must provide (the contracts this file relies on):
 *  - Letters carry `data-lit`: "in" while a letter drops in (volt), "glow" from 55% of its lock-in (volt with a
 *    glow), "done" once it has locked in (LED white). The factory never tweens colours; the screen styles
 *    `[data-lit="..."]` with tokens (a CSS transition between the states gives the artboard's volt-to-white fade).
 *  - `fig` is lit through the custom property `--lit` (0 = silhouette, 1 = lit). The screen's CSS reads it for
 *    `filter: brightness(...) saturate(...)` and the volt rim, so the rim's colour stays a token.
 *  - The idle loops are the CSS classes animate-cta-glow (cta), animate-breathe (idle) and animate-face-sweep
 *    (sweep); the timeline only adds them, at their beats, and removes them when it starts over.
 *
 * Eases: CSS `ease-out` is "power1.out" and `linear` is "none"; every cubic-bezier of the artboard is the
 * matching token in EASE (lib/motion.ts).
 */

type Timeline = gsap.core.Timeline;
type Ease = string | ((t: number) => number);
type Target = HTMLElement | HTMLElement[] | undefined;
type Frames = Record<number, gsap.TweenVars>;

export type IntroBeatName = "comm" | "bank" | "done";

/** One flying pixel: `anchor` is the zero-size point that scales away, `dot` the coloured square inside it. */
export interface IntroPixelRef {
  anchor: HTMLElement;
  dot: HTMLElement;
}

/** Everything the timeline may move. Every ref is optional: a track whose ref is missing is skipped. */
export interface IntroRefs {
  root?: HTMLElement;
  banks?: HTMLElement[];
  /** The glow layer inside each bank, flared at the stadium flash. */
  flares?: HTMLElement[];
  /** [left, right]. */
  cones?: HTMLElement[];
  crowd?: HTMLElement;
  sky?: HTMLElement;
  field?: HTMLElement;
  backlight?: HTMLElement;
  /** Board power-up glow layer. */
  boardOn?: HTMLElement;
  /** Board edge hit glow layer. */
  boardHit?: HTMLElement;
  boardHeader?: HTMLElement;
  scan?: HTMLElement;
  /** The silhouette that swings in. */
  mover?: HTMLElement;
  ghosts?: HTMLElement[];
  trails?: HTMLElement;
  /** The figure inside the mover: lit through `--lit`, glitched at the impact. */
  fig?: HTMLElement;
  /** The three head-turn strips, in order. */
  strips?: HTMLElement[];
  /** The still pose shown when the head turn cannot play. */
  rest?: HTMLElement;
  shock?: HTMLElement;
  streak?: HTMLElement;
  glints?: HTMLElement[];
  pixels?: IntroPixelRef[];
  letters?: HTMLElement[];
  title?: HTMLElement;
  /** The white bar that leads the title wipe. */
  titleBar?: HTMLElement;
  tagline?: HTMLElement[];
  /** The board's bottom strip. */
  strip?: HTMLElement;
  flash?: HTMLElement;
  welcome?: HTMLElement;
  cta?: HTMLElement;
  /** The wrapper that breathes (animate-breathe). */
  idle?: HTMLElement;
  /** The face-sweep layer (animate-face-sweep). */
  sweep?: HTMLElement;
}

export interface IntroOptions {
  tier: IntroTier;
  /** How the head-turn strips are loading (rig.ts). */
  rig: Promise<RigResult>;
  onBeat?: (beat: IntroBeatName) => void;
}

const OUT = "power1.out";
const LINEAR = "none";

/** The head turn: three strips of 16 frames, each .667 s, one after another (README §6, §8). */
const STRIP_FRAMES = 16;
const STRIP_SECONDS = 0.667;
const STRIP_AT = [0, 0.667, 1.333] as const;
/** The wait for the strips at the performance beat (L7). */
const RIG_WAIT_MS = 1500;
/** Parts that depend on the rig's answer start just after the pause that waits for it. */
const AFTER_GATE = 0.001;
/** How far the title's leading bar travels (design px). */
const BAR_TRAVEL = 560;

/** The artboard's bank flicker (keyframes `bank`). */
const BANK_FLICKER = {
  "0%": { opacity: 0.04 },
  "15%": { opacity: 0.04 },
  "20%": { opacity: 1 },
  "24%": { opacity: 0.2 },
  "30%": { opacity: 1 },
  "100%": { opacity: 1 },
  easeEach: OUT,
};

/** The impact glitch (keyframes `impact`, steps(1)): each state holds for 20% of .32 s. */
const GLITCH = [
  { at: 0, x: 0, clipPath: "inset(0% 0% 0% 0%)" },
  { at: 0.064, x: -16, clipPath: "inset(18% 0% 60% 0%)" },
  { at: 0.128, x: 12, clipPath: "inset(55% 0% 15% 0%)" },
  { at: 0.192, x: -5, clipPath: "inset(0% 0% 0% 0%)" },
  { at: 0.256, x: 0, clipPath: "none" },
] as const;

/** How the three kinds of letter enter (keyframes la / lb / lc). `side` is the sideways nudge at 70%. */
const LOCK: Record<
  LetterKind,
  { from: gsap.TweenVars; to: gsap.TweenVars; blur: number; side: number; move: number }
> = {
  la: { from: { y: -60, scaleY: 1.9 }, to: { y: 0, scaleY: 1 }, blur: 12, side: 5, move: 0.7 },
  lb: { from: { y: 70, scaleX: 1.6 }, to: { y: 0, scaleX: 1 }, blur: 12, side: -5, move: 0.7 },
  lc: { from: { scale: 2.4 }, to: { scale: 1 }, blur: 16, side: 0, move: 1 },
};
const LOCK_SECONDS = 0.7;
const LOCK_GLOW_AT = 0.55;

/** Whether the head turn plays, learned from the rig promise. */
interface RigWatch {
  result: RigResult | null;
  /** The decision is made once (at the performance beat) and kept for every replay. */
  decided: boolean;
  useStrips: boolean;
}

interface Ctx {
  tl: Timeline;
  refs: IntroRefs;
  beats: Partial<Record<Beat, number>>;
  /** How long reveals run, as a multiple of the board's (INTRO_TEMPO). */
  k: number;
  rig: RigWatch;
  rigPromise: Promise<RigResult>;
  onBeat?: (beat: IntroBeatName) => void;
}

/** A place on the timeline: the beat's label plus an offset, with the same moment in seconds. */
interface Pos {
  label: string;
  seconds: number;
}

/** Where `beat` + `offset` sits, or undefined when this tier has no such beat (its tracks are then skipped). */
function at(c: Ctx, beat: Beat, offset = 0): Pos | undefined {
  const base = c.beats[beat];
  if (base === undefined) return undefined;
  return { label: offset === 0 ? beat : `${beat}+=${offset}`, seconds: base + offset };
}

const gap = (c: Ctx, key: "bankGap" | "ghostGap" | "letterGap" | "taglineGap") => c.beats[key] ?? 0;
const parts = (target: Target): HTMLElement[] => (target === undefined ? [] : [target].flat());

/** A timeline callback that only fires going forward (calls also fire when the playhead is moved back past them). */
function call(c: Ctx, pos: Pos, fn: () => void): void {
  c.tl.call(
    () => {
      if (c.tl.time() >= pos.seconds - 1e-6) fn();
    },
    undefined,
    pos.label,
  );
}

/** Hidden from the start (and after a rewind), so it cannot take focus before its beat. */
function hide(c: Ctx, target: Target): void {
  if (parts(target).length > 0) c.tl.set(target!, { autoAlpha: 0, immediateRender: true }, 0);
}

/** Snap visible at `pos`. */
function show(c: Ctx, target: Target, pos: Pos): void {
  if (parts(target).length > 0)
    c.tl.to(target!, { autoAlpha: 1, duration: 0, immediateRender: false }, pos.label);
}

/** Hidden until `pos`, then keyframes of autoAlpha (and anything else in `frames`) keyed by percent. */
function appear(
  c: Ctx,
  target: Target,
  pos: Pos | undefined,
  seconds: number,
  ease: Ease,
  frames: Frames,
): void {
  if (parts(target).length === 0 || pos === undefined) return;
  const keyframes: Record<string, unknown> = { easeEach: ease };
  for (const [percent, vars] of Object.entries(frames)) keyframes[`${percent}%`] = vars;
  hide(c, target);
  c.tl.to(target!, { keyframes, duration: seconds } as gsap.TweenVars, pos.label);
}

/** Fade in from hidden (the artboard's `fade`). */
function fade(c: Ctx, target: Target, beat: Beat, seconds: number): void {
  const pos = at(c, beat);
  if (parts(target).length === 0 || pos === undefined) return;
  c.tl.fromTo(
    target!,
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: seconds * c.k, ease: OUT },
    pos.label,
  );
}

/** Rise 14 px into place from hidden (the artboard's `rise`). */
function rise(c: Ctx, target: Target, beat: Beat, offset: number, seconds: number): void {
  const pos = at(c, beat, offset);
  if (parts(target).length === 0 || pos === undefined) return;
  c.tl.fromTo(
    target!,
    { autoAlpha: 0, y: 14 },
    { autoAlpha: 1, y: 0, duration: seconds * c.k, ease: EASE.follow, clearProps: "transform" },
    pos.label,
  );
}

/** The lights come up: banks flicker on one after another, then crowd, cones, sky, field and the warm backlight. */
function addLights(c: Ctx): void {
  list(c.refs.banks).forEach((bank, i) => {
    const pos = at(c, "banks", i * gap(c, "bankGap"));
    if (pos === undefined) return;
    c.tl.set(bank, { opacity: 0.04, immediateRender: true }, 0);
    c.tl.to(bank, { keyframes: BANK_FLICKER, duration: 1.1 } as gsap.TweenVars, pos.label);
    call(c, pos, () => c.onBeat?.("bank"));
  });
  fade(c, c.refs.crowd, "crowd", 1);
  fade(c, c.refs.cones?.[0], "coneL", 1);
  fade(c, c.refs.cones?.[1], "coneR", 1);
  fade(c, c.refs.sky, "sky", 1);
  fade(c, c.refs.field, "field", 1);
  fade(c, c.refs.backlight, "backlight", 1);
}

/** The scoreboard powers up (a glow layer, not a box-shadow tween, L14) and the scan bar leads the entrance. */
function addBoard(c: Ctx): void {
  const { refs, tl } = c;
  fade(c, refs.boardOn, "boardOn", 0.7);
  fade(c, refs.boardHeader, "boardHeader", 1);
  appear(c, refs.boardHit, at(c, "impact"), 0.7, OUT, {
    0: { autoAlpha: 0 },
    25: { autoAlpha: 1 },
    100: { autoAlpha: 0 },
  });
  const entrance = at(c, "entrance");
  if (refs.scan && entrance) {
    tl.fromTo(
      refs.scan,
      { x: -120 },
      { x: 1300, duration: 1, ease: EASE.standard },
      entrance.label,
    );
    appear(c, refs.scan, entrance, 1, EASE.standard, {
      0: { autoAlpha: 0 },
      10: { autoAlpha: 1 },
      90: { autoAlpha: 1 },
      100: { autoAlpha: 0 },
    });
  }
}

/** The artboard's `travel`: in from the left, turned and blurred, settling square-on. */
function swing(c: Ctx, target: HTMLElement, pos: Pos): void {
  c.tl.fromTo(
    target,
    { x: -1180, rotationY: 30, scale: 0.9, transformPerspective: 1300 },
    { x: 0, rotationY: 0, scale: 1, duration: 0.95, ease: EASE.entrance },
    pos.label,
  );
  c.tl.to(
    target,
    {
      keyframes: {
        "0%": { filter: "blur(10px)" },
        "65%": { filter: "blur(2px)" },
        "100%": { filter: "blur(0px)" },
        easeEach: EASE.entrance,
      },
      duration: 0.95,
    } as gsap.TweenVars,
    pos.label,
  );
}

/** The silhouette swings in with two fading ghosts, a light trail, and a shockwave where it lands. */
function addEntrance(c: Ctx): void {
  const { refs } = c;
  const entrance = at(c, "entrance");
  if (entrance === undefined) return;
  if (refs.mover) {
    hide(c, refs.mover);
    show(c, refs.mover, entrance);
    swing(c, refs.mover, entrance);
  }
  list(refs.ghosts).forEach((ghost, i) => {
    const pos = at(c, "entrance", (i + 1) * gap(c, "ghostGap"))!;
    appear(c, ghost, pos, 1.05, LINEAR, {
      0: { autoAlpha: 0.5 },
      70: { autoAlpha: 0.2 },
      100: { autoAlpha: 0 },
    });
    swing(c, ghost, pos);
  });
  appear(c, refs.trails, entrance, 1.25, OUT, {
    0: { autoAlpha: 0 },
    15: { autoAlpha: 1 },
    75: { autoAlpha: 0.7 },
    100: { autoAlpha: 0 },
  });
  const impact = at(c, "impact");
  if (refs.shock && impact) {
    appear(c, refs.shock, impact, 0.6, OUT, {
      0: { autoAlpha: 0 },
      20: { autoAlpha: 1 },
      100: { autoAlpha: 0 },
    });
    c.tl.fromTo(refs.shock, { scaleX: 0.2 }, { scaleX: 3, duration: 0.6, ease: OUT }, impact.label);
  }
}

/**
 * The impact (glitch slices on the figure) and the head turn. The strips need the rig, so the timeline pauses
 * at the performance beat until it is known (L7); the parts that depend on the answer start just after it.
 */
function addPerformance(c: Ctx): void {
  const { refs, tl } = c;
  const performance = at(c, "performance");
  if (performance === undefined) return;
  addRigGate(c, performance);

  if (refs.fig) {
    tl.fromTo(
      refs.fig,
      { "--lit": 0 },
      { "--lit": 1, duration: 0.8, ease: EASE.standard },
      performance.label,
    );
    const impact = at(c, "impact");
    if (impact) {
      for (const state of GLITCH) {
        tl.set(refs.fig, { x: state.x, clipPath: state.clipPath }, `${impact.label}+=${state.at}`);
      }
    }
  }
  addStrips(c);
}

/** Pause at the performance beat; carry on at once if the rig is known, else when it is, or after 1.5 s. */
function addRigGate(c: Ctx, performance: Pos): void {
  const { tl, rig } = c;
  const decide = () => {
    rig.decided = true;
    rig.useStrips = rig.result === "ready";
  };
  const resume = () => {
    // A timeline killed meanwhile has no parent; one that already ran to its end is left as it is.
    if (tl.parent && tl.paused() && tl.progress() < 1) tl.resume();
  };
  tl.addPause(performance.label, () => {
    if (tl.time() < performance.seconds - 1e-6) return;
    if (!rig.decided && rig.result !== null) decide();
    if (rig.decided) {
      // Not from inside this render: resuming here makes GSAP drop the callbacks of a jump past the beat.
      queueMicrotask(resume);
      return;
    }
    // Natural playback has paused here already; a jump past the beat has not.
    tl.pause();
    const release = () => {
      clearTimeout(timer);
      if (rig.decided) return;
      decide();
      resume();
    };
    const timer = setTimeout(release, RIG_WAIT_MS);
    c.rigPromise.then(release, release);
  });
}

/** Strip A, B, C play in turn; the rest pose takes over when there are no frames. */
function addStrips(c: Ctx): void {
  const { refs, tl, rig } = c;
  const playing = () => (rig.decided ? rig.useStrips : rig.result === "ready");
  list(refs.strips)
    .slice(0, STRIP_AT.length)
    .forEach((strip, i) => {
      const proxy = { p: 0 };
      const setFrame = () => {
        strip.style.backgroundPosition = framePosition(
          frameAt(proxy.p, STRIP_FRAMES),
          STRIP_FRAMES,
        );
      };
      const start = at(c, "performance", STRIP_AT[i]!)!;
      if (i > 0) hide(c, strip);
      // Strip A is on show since the entrance; with no frames none of them is. Decided after the gate.
      const turn = at(c, "performance", STRIP_AT[i]! + AFTER_GATE)!;
      tl.to(
        strip,
        { autoAlpha: () => (playing() ? 1 : 0), duration: 0, immediateRender: false },
        turn.label,
      );
      tl.to(
        proxy,
        {
          p: 1,
          duration: STRIP_SECONDS,
          ease: LINEAR,
          onUpdate: setFrame,
          // A jump over the whole strip may skip onUpdate; the last frame must still land.
          onComplete: setFrame,
        },
        start.label,
      );
      // The next strip takes over at its own start.
      const next = STRIP_AT[i + 1];
      if (next !== undefined) {
        tl.to(
          strip,
          { autoAlpha: 0, duration: 0, immediateRender: false },
          at(c, "performance", next)!.label,
        );
      }
    });
  if (refs.rest) {
    hide(c, refs.rest);
    const pos = at(c, "performance", AFTER_GATE)!;
    tl.to(
      refs.rest,
      { autoAlpha: () => (playing() ? 0 : 1), duration: 0, immediateRender: false },
      pos.label,
    );
  }
}

/** The eye-line flare and two glints, as he looks into the camera. */
function addLook(c: Ctx): void {
  const { refs } = c;
  const look = at(c, "look");
  if (look === undefined) return;
  appear(c, refs.streak, look, 0.55, EASE.follow, {
    0: { autoAlpha: 0, scaleX: 0 },
    30: { autoAlpha: 1, scaleX: 1 },
    100: { autoAlpha: 0, scaleX: 1.25 },
  });
  const glints = at(c, "look", 0.02)!;
  appear(c, refs.glints, glints, 0.5, OUT, {
    0: { autoAlpha: 0, scale: 0.3 },
    35: { autoAlpha: 0.85, scale: 1 },
    100: { autoAlpha: 0, scale: 0.3 },
  });
}

/** The 90 pixels fly into the name area; the letters lock in out of order. */
function addName(c: Ctx): void {
  addPixels(c);
  const letters = list(c.refs.letters);
  const plan = planLetters(letters.length);
  letters.forEach((letter, i) => addLetter(c, letter, plan[i]!.kind, plan[i]!.order));
}

function addPixels(c: Ctx): void {
  const base = c.beats.pixels;
  const refs = list(c.refs.pixels);
  if (base === undefined || refs.length === 0) return;
  hide(
    c,
    refs.map((p) => p.anchor),
  );
  createPixels().forEach((pixel, i) => {
    const anchor = refs[i]?.anchor;
    if (!anchor) return;
    const pos = at(c, "pixels", Number((pixel.delay - base).toFixed(3)))!;
    c.tl.fromTo(anchor, { scale: 1 }, { scale: 0.02, duration: 0.8, ease: EASE.absorb }, pos.label);
    appear(c, anchor, pos, 0.8, EASE.absorb, {
      0: { autoAlpha: 0 },
      18: { autoAlpha: 1 },
      100: { autoAlpha: 0.15 },
    });
  });
}

/** One letter: fades and de-blurs to 55%, settles into place with a sideways nudge, and tells its state through data-lit. */
function addLetter(c: Ctx, letter: HTMLElement, kind: LetterKind, order: number): void {
  const { tl, k } = c;
  const lock = LOCK[kind];
  const total = LOCK_SECONDS * k;
  const start = order * gap(c, "letterGap");
  const pos = at(c, "name", start);
  if (pos === undefined) return;

  tl.fromTo(
    letter,
    { autoAlpha: 0, filter: `blur(${lock.blur}px)` },
    {
      autoAlpha: 1,
      filter: "blur(0px)",
      duration: total * LOCK_GLOW_AT,
      ease: EASE.follow,
      clearProps: "filter",
    },
    pos.label,
  );
  const moveSeconds = lock.move * total;
  const last = lock.side === 0;
  tl.fromTo(
    letter,
    lock.from,
    {
      ...lock.to,
      duration: moveSeconds,
      ease: EASE.follow,
      ...(last ? { clearProps: "transform" } : {}),
    },
    pos.label,
  );
  if (!last) {
    tl.fromTo(
      letter,
      { x: 0 },
      { x: lock.side, duration: moveSeconds, ease: EASE.follow },
      pos.label,
    );
    tl.to(
      letter,
      {
        x: 0,
        duration: total - moveSeconds,
        ease: EASE.follow,
        clearProps: "transform",
        immediateRender: false,
      },
      at(c, "name", start + moveSeconds)!.label,
    );
  }
  call(c, pos, () => letter.setAttribute("data-lit", "in"));
  call(c, at(c, "name", start + total * LOCK_GLOW_AT)!, () =>
    letter.setAttribute("data-lit", "glow"),
  );
  call(c, at(c, "name", start + total)!, () => letter.setAttribute("data-lit", "done"));
}

/** SOFTWARE ENGINEER is wiped in behind a white leading bar. */
function addTitle(c: Ctx): void {
  const { refs, tl } = c;
  const pos = at(c, "title");
  if (pos === undefined) return;
  const seconds = 0.6 * c.k;
  if (refs.title) {
    hide(c, refs.title);
    show(c, refs.title, pos);
    tl.fromTo(
      refs.title,
      { clipPath: "inset(0% 100% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: seconds, ease: EASE.swing },
      pos.label,
    );
  }
  if (refs.titleBar) {
    hide(c, refs.titleBar);
    show(c, refs.titleBar, pos);
    tl.fromTo(
      refs.titleBar,
      { x: 0 },
      { x: BAR_TRAVEL, duration: seconds, ease: EASE.swing },
      pos.label,
    );
    const fadeOut = at(c, "title", seconds * 0.9)!;
    tl.to(
      refs.titleBar,
      { autoAlpha: 0, duration: seconds * 0.1, ease: EASE.swing, immediateRender: false },
      fadeOut.label,
    );
  }
}

/** PLAYER 01 • ENGINEER • BUILDER • COMPETITOR ticks in piece by piece. */
function addTagline(c: Ctx): void {
  list(c.refs.tagline).forEach((part, i) =>
    rise(c, part, "tagline", i * gap(c, "taglineGap"), 0.6),
  );
}

/** The board's bottom strip, the stadium flash with the banks flaring, WELCOME, the CTA and the commentary. */
function addFinale(c: Ctx): void {
  const { refs } = c;
  fade(c, refs.strip, "strip", 1);
  const flash = at(c, "flash");
  if (flash) {
    appear(c, refs.flash, flash, 0.9, OUT, {
      0: { autoAlpha: 0 },
      25: { autoAlpha: 0.55 },
      100: { autoAlpha: 0 },
    });
    list(refs.flares).forEach((flare, i) => {
      appear(c, flare, at(c, "flash", i * 0.05), 1, OUT, {
        0: { autoAlpha: 0 },
        30: { autoAlpha: 1 },
        100: { autoAlpha: 0 },
      });
    });
  }
  rise(c, refs.welcome, "welcome", 0, 0.6);
  rise(c, refs.cta, "cta", 0, 0.7);
  const comm = at(c, "comm");
  if (comm) call(c, comm, () => c.onBeat?.("comm"));
}

/** The loops that run forever are CSS; the timeline starts them at their beats. */
function addIdle(c: Ctx): void {
  const { refs } = c;
  const glow = at(c, "ctaGlow");
  if (glow && refs.cta) call(c, glow, () => refs.cta!.classList.add("animate-cta-glow"));
  const idle = at(c, "idle");
  if (idle && refs.idle) call(c, idle, () => refs.idle!.classList.add("animate-breathe"));
  // The sweep starts .4 s after the breathing (artboard: 4.3 s against 3.9 s).
  const sweep = at(c, "idle", 0.4);
  if (sweep && refs.sweep) call(c, sweep, () => refs.sweep!.classList.add("animate-face-sweep"));
}

function list<T>(items: T[] | undefined): T[] {
  return items ?? [];
}

/** Back to the starting state of anything the timeline sets by hand rather than by tween. */
function resetHandSetState(refs: IntroRefs): void {
  refs.cta?.classList.remove("animate-cta-glow");
  refs.idle?.classList.remove("animate-breathe");
  refs.sweep?.classList.remove("animate-face-sweep");
  list(refs.letters).forEach((letter) => letter.removeAttribute("data-lit"));
  list(refs.strips).forEach(
    (strip) => (strip.style.backgroundPosition = framePosition(0, STRIP_FRAMES)),
  );
}

function watchRig(rig: Promise<RigResult>): RigWatch {
  const watch: RigWatch = { result: null, decided: false, useStrips: false };
  rig.then(
    (result) => (watch.result = result),
    () => (watch.result = "error"),
  );
  return watch;
}

/**
 * Build the Player Introduction for a tier. It plays at once; the caller owns it (pause, restart, kill or
 * revert it). `onBeat("bank")` fires as each floodlight bank flickers on, "comm" at the commentary beat and
 * "done" at the end, once per play.
 */
export function createIntroTimeline(
  gsap: typeof Gsap,
  refs: IntroRefs,
  opts: IntroOptions,
): Timeline {
  const beats: Partial<Record<Beat, number>> = INTRO_BEATS[opts.tier];
  const tl = gsap.timeline();
  const c: Ctx = {
    tl,
    refs,
    beats,
    k: INTRO_TEMPO[opts.tier],
    rig: watchRig(opts.rig),
    rigPromise: opts.rig,
    onBeat: opts.onBeat,
  };
  for (const [beat, seconds] of Object.entries(beats)) {
    if (!isGap(beat)) tl.addLabel(beat, seconds);
  }
  addLights(c);
  addBoard(c);
  addEntrance(c);
  addPerformance(c);
  addLook(c);
  addName(c);
  addTitle(c);
  addTagline(c);
  addFinale(c);
  addIdle(c);
  call(c, { label: "+=0", seconds: tl.duration() }, () => opts.onBeat?.("done"));
  tl.eventCallback("onStart", () => resetHandSetState(refs));
  return tl;
}

/**
 * Put every ref at the intro's end state: all revealed, the rest pose standing in for the head turn, the idle
 * loops not started (reduced motion, stories, SKIP). The caller kills any running timeline first.
 */
export function showIntroEndState(gsap: typeof Gsap, refs: IntroRefs): void {
  const defined = (items: (HTMLElement | undefined)[]) =>
    items.filter((item): item is HTMLElement => item !== undefined);
  gsap.set(
    defined([
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
      ...list(refs.cones),
      ...list(refs.tagline),
      ...list(refs.letters),
    ]),
    { autoAlpha: 1, clearProps: "transform,filter,clipPath" },
  );
  gsap.set(list(refs.banks), { opacity: 1 });
  gsap.set(
    defined([
      refs.boardHit,
      refs.scan,
      refs.trails,
      refs.shock,
      refs.streak,
      refs.titleBar,
      refs.flash,
      ...list(refs.strips),
      ...list(refs.ghosts),
      ...list(refs.glints),
      ...list(refs.flares),
      ...list(refs.pixels).map((p) => p.anchor),
    ]),
    { autoAlpha: 0 },
  );
  if (refs.fig) gsap.set(refs.fig, { "--lit": 1, clipPath: "none", clearProps: "transform" });
  list(refs.letters).forEach((letter) => letter.setAttribute("data-lit", "done"));
}
