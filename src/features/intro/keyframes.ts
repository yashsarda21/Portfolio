import type { LetterKind } from "./letters";

/*
 * The intro's keyframe tables: the numbers the artboard's CSS keyframes give, kept apart from the timeline
 * factory (timeline.ts) that places them on the beats.
 */

/** CSS `ease-out` is "power1.out" and `linear` is "none" in GSAP. */
export const OUT = "power1.out";
export const LINEAR = "none";

/** The head turn: three strips of 16 frames, each .667 s, one after another (README section 6, section 8). */
export const STRIP_FRAMES = 16;
export const STRIP_SECONDS = 0.667;
/** When each strip starts, in seconds from the head turn's own start. */
export const STRIP_AT = [0, 0.667, 1.333] as const;

/** How far the title's leading bar travels on the stage (design px). */
export const BAR_TRAVEL = 560;

/** The artboard's bank flicker (keyframes `bank`). */
export const BANK_FLICKER = {
  "0%": { opacity: 0.04 },
  "15%": { opacity: 0.04 },
  "20%": { opacity: 1 },
  "24%": { opacity: 0.2 },
  "30%": { opacity: 1 },
  "100%": { opacity: 1 },
  easeEach: OUT,
};

/** The impact glitch (keyframes `impact`, steps(1)): each state holds for 20% of .32 s. */
export const GLITCH = [
  { at: 0, x: 0, clipPath: "inset(0% 0% 0% 0%)" },
  { at: 0.064, x: -16, clipPath: "inset(18% 0% 60% 0%)" },
  { at: 0.128, x: 12, clipPath: "inset(55% 0% 15% 0%)" },
  { at: 0.192, x: -5, clipPath: "inset(0% 0% 0% 0%)" },
  { at: 0.256, x: 0, clipPath: "none" },
] as const;

/** How the three kinds of letter enter (keyframes la / lb / lc). `side` is the sideways nudge at 70%. */
export const LOCK: Record<
  LetterKind,
  { from: gsap.TweenVars; to: gsap.TweenVars; blur: number; side: number; move: number }
> = {
  la: { from: { y: -60, scaleY: 1.9 }, to: { y: 0, scaleY: 1 }, blur: 12, side: 5, move: 0.7 },
  lb: { from: { y: 70, scaleX: 1.6 }, to: { y: 0, scaleX: 1 }, blur: 12, side: -5, move: 0.7 },
  lc: { from: { scale: 2.4 }, to: { scale: 1 }, blur: 16, side: 0, move: 1 },
};
export const LOCK_SECONDS = 0.7;
export const LOCK_GLOW_AT = 0.55;
