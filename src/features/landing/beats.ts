import type { CSSProperties } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Main's boot, in seconds: each part's turn (its animation-delay on the artboard). The banks flicker on in
 * ArenaBackdrop (boot) at the same turns; they are listed here so the whole show reads in one place.
 */
export const LANDING_BEATS = {
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
  banks: [0.6, 1.1, 1.6, 2.0],
} as const;

/** A part's turn for the animate-boot-* presets (they read --d in seconds, times --pace). */
export function bootDelay(beat: number): CSSProperties {
  return { "--d": `${beat}s` } as CSSProperties;
}

/**
 * How fast this visit plays, as a multiplier on every beat: the page's `--pace` (1 the first time, the return
 * visit's pace from pace.css), 0 under reduced motion (everything is already at its end state). Read from the
 * computed style, so the number lives in the CSS only.
 */
export function landingPace(): number {
  if (prefersReducedMotion()) return 0;
  const pace = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pace"));
  return Number.isFinite(pace) ? pace : 1;
}
