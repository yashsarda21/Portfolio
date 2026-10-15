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

/** The keyframes the boot's presets run (motion.css), by name. */
const BOOT_KEYFRAMES = new Set(["fade-in", "rise-in", "boot-name", "boot-scan"]);

/**
 * How far into the boot the page is, in milliseconds, read from the boot's own animations (their clock, so a
 * sound placed from it stays in step with what is on screen even when the page took a while to start up).
 * 0 when none is running (a start screen is holding them, or they are all done and gone).
 */
export function bootElapsedMs(): number {
  if (typeof document === "undefined" || typeof document.getAnimations !== "function") return 0;
  for (const animation of document.getAnimations()) {
    const name = (animation as Partial<CSSAnimation>).animationName;
    if (name && BOOT_KEYFRAMES.has(name) && typeof animation.currentTime === "number")
      return animation.currentTime;
  }
  return 0;
}

/** True while the first-visit start screen holds the boot: scripts are running, this is no return visit, and no button has been pressed. */
export function bootIsHeld(root: HTMLElement = document.documentElement): boolean {
  return (
    root.classList.contains("js") &&
    !root.hasAttribute("data-return-visit") &&
    !root.hasAttribute("data-started")
  );
}
