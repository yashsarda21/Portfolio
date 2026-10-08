import type { gsap as Gsap } from "gsap";
import { EASE } from "@/lib/motion";
import { frameAt, framePosition } from "@/lib/sprite";
import { INTRO_BEATS, INTRO_TEMPO, isGap, type Beat, type IntroTier } from "./beats";
import { planLetters, type LetterKind } from "./letters";
import { createPixels } from "./pixels";
import {
  BANK_FLICKER,
  BAR_TRAVEL,
  GLITCH,
  LINEAR,
  LOCK,
  LOCK_GLOW_AT,
  LOCK_SECONDS,
  OUT,
  STRIP_AT,
  STRIP_FRAMES,
  STRIP_SECONDS,
} from "./keyframes";
import type { RigResult } from "./rig";
import { gateHeadTurn, type HeadTurnGate } from "./rigGate";

/*
 * The Player Introduction as one GSAP timeline, built from the beat table (beats.ts), never from seconds typed
 * into tweens. It knows nothing about the DOM beyond the elements it is handed (IntroRefs); the screen collects
 * them. GSAP itself is a parameter so it is only ever loaded on demand (spec §9.1).
 *
 * What the screen must provide (the contracts this file relies on):
 *  - Letters carry `data-lit`: "in" while a letter drops in (volt), "glow" from 55% of its lock-in (volt with a
 *    glow), "done" once it has locked in (LED white). The factory never tweens colours; the screen styles
 *    `[data-lit="..."]` with tokens (a CSS transition between the states gives the artboard's volt-to-white fade).
 *  - `shade` is the figure's backlit silhouette: a dark copy of the rest pose with the volt rim, laid over the lit
 *    figure. The timeline fades its opacity 1 to 0 as the lights come up; nothing animates a filter, and the
 *    figure carries none at the end (L14).
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

/** Everything the timeline may move. Every ref is optional: a track whose ref is missing is skipped. */
export interface IntroRefs {
  root?: HTMLElement;
  banks?: HTMLElement[];
  /** The glow layer inside each bank, flared at the stadium flash. */
  flares?: HTMLElement[];
  /** [left, right]. */
  cones?: HTMLElement[];
  /** The dust in the beams: it comes up with the left cone. */
  dust?: HTMLElement;
  crowd?: HTMLElement;
  /** The scene's sky glow and the Stage's letterbox sky fade in together, so this may be several layers. */
  sky?: HTMLElement | HTMLElement[];
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
  /** The figure inside the mover: glitched at the impact. */
  fig?: HTMLElement;
  /** The silhouette treatment over the lit figure; its opacity goes 1 to 0 as the lights come up. */
  shade?: HTMLElement;
  /** The three head-turn strips, in order. */
  strips?: HTMLElement[];
  /** The still pose: the silhouette from the entrance, and what stands when the head turn cannot play. */
  rest?: HTMLElement;
  /** The phone's portrait: there is no mover or head turn there, so the rest pose fades in with the board. */
  portrait?: HTMLElement;
  shock?: HTMLElement;
  streak?: HTMLElement;
  glints?: HTMLElement[];
  /** The 90 flying pixels: each is the zero-size point that scales away (the coloured square sits inside it). */
  pixels?: HTMLElement[];
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

interface Ctx {
  gsap: typeof Gsap;
  tier: IntroTier;
  tl: Timeline;
  refs: IntroRefs;
  beats: Partial<Record<Beat, number>>;
  /** How long reveals run, as a multiple of the board's (INTRO_TEMPO). */
  k: number;
  rig: Promise<RigResult>;
  /** Set once the head turn is built; the show calls its `reset` each time it starts over. */
  gate?: HeadTurnGate;
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
  fade(c, c.refs.dust, "coneL", 1);
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
  fade(c, refs.portrait, "boardHeader", 1);
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
  // A filter left on at rest would be repainted with every frame of the idle loops (L14).
  c.tl.to(
    target,
    { clearProps: "filter", duration: 0, immediateRender: false },
    `${pos.label}+=0.95`,
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
  // The still pose is the silhouette from the entrance, so the swing-in is never an empty box while the head-turn
  // frames load (L7). It steps aside only if the head turn plays.
  hide(c, refs.rest);
  show(c, refs.rest, entrance);
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
 * The impact (glitch slices on the figure), the lights coming up over the silhouette, and the head turn. The head
 * turn needs the rig, so it is a child timeline that waits for it (rigGate.ts); the rest of the show runs on.
 */
function addPerformance(c: Ctx): void {
  const { refs, tl } = c;
  const performance = at(c, "performance");
  if (performance === undefined) return;

  if (refs.shade) {
    tl.fromTo(
      refs.shade,
      { autoAlpha: 1 },
      { autoAlpha: 0, duration: 0.8, ease: EASE.standard },
      performance.label,
    );
  }
  if (refs.fig) {
    const impact = at(c, "impact");
    if (impact) {
      for (const state of GLITCH) {
        tl.set(refs.fig, { x: state.x, clipPath: state.clipPath }, `${impact.label}+=${state.at}`);
      }
    }
  }
  addHeadTurn(c, performance);
}

/** Strip A, B, C play in turn and the rest pose steps aside; with no frames none of that happens. */
function addHeadTurn(c: Ctx, performance: Pos): void {
  const { refs, tl } = c;
  const strips = list(refs.strips).slice(0, STRIP_AT.length);
  if (strips.length === 0) return;
  const turn = c.gsap.timeline();
  strips.forEach((strip, i) => {
    const proxy = { p: 0 };
    const setFrame = () => {
      strip.style.backgroundPosition = framePosition(frameAt(proxy.p, STRIP_FRAMES), STRIP_FRAMES);
    };
    // Strip A is on show since the entrance (CSS); B and C wait for their turn.
    if (i > 0) hide(c, strip);
    turn.to(strip, { autoAlpha: 1, duration: 0, immediateRender: false }, STRIP_AT[i]);
    turn.to(
      proxy,
      {
        p: 1,
        duration: STRIP_SECONDS,
        ease: LINEAR,
        onUpdate: setFrame,
        // A jump over the whole strip may skip onUpdate; the last frame must still land.
        onComplete: setFrame,
      },
      STRIP_AT[i],
    );
    // The next strip takes over at its own start.
    const next = STRIP_AT[i + 1];
    if (next !== undefined) {
      turn.to(strip, { autoAlpha: 0, duration: 0, immediateRender: false }, next);
    }
  });
  if (refs.rest) turn.to(refs.rest, { autoAlpha: 0, duration: 0, immediateRender: false }, 0);

  c.gate = gateHeadTurn({
    tl,
    turn,
    seconds: performance.seconds,
    rig: c.rig,
    stand: () => c.gsap.set(strips, { autoAlpha: 0 }),
  });
  tl.add(turn, performance.label);
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
  hide(c, refs);
  createPixels().forEach((pixel, i) => {
    const anchor = refs[i];
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
    // The stage's bar runs the artboard's 560px. A phone's title is narrower than that, so the bar follows the
    // title: its width is read when the wipe starts (the fonts are in by then), not when the timeline is built.
    const title = refs.title;
    const phone = c.tier === "mobile" && title !== undefined;
    tl.fromTo(
      refs.titleBar,
      { x: 0 },
      {
        x: phone ? () => title.offsetWidth : BAR_TRAVEL,
        duration: seconds,
        ease: EASE.swing,
        ...(phone ? { immediateRender: false } : {}),
      },
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
    gsap,
    tier: opts.tier,
    tl,
    refs,
    beats,
    k: INTRO_TEMPO[opts.tier],
    rig: opts.rig,
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
  tl.eventCallback("onStart", () => {
    resetHandSetState(refs);
    c.gate?.reset();
  });
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
      ...parts(refs.sky),
      refs.field,
      refs.backlight,
      refs.boardOn,
      refs.boardHeader,
      refs.mover,
      refs.rest,
      refs.portrait,
      refs.dust,
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
      refs.shade,
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
      ...list(refs.pixels),
    ]),
    { autoAlpha: 0 },
  );
  if (refs.fig) gsap.set(refs.fig, { clipPath: "none", clearProps: "transform" });
  list(refs.letters).forEach((letter) => letter.setAttribute("data-lit", "done"));
}
