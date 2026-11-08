import { LANDING_BEATS } from "@/features/landing/beats";
import { INTRO_BANKS, INTRO_BEATS } from "@/features/intro/beats";

/** The two recordings (public/audio, CC0, credited in CREDITS.md). Fetched and decoded only after a visitor's click. */
export const SHOW_FILES = {
  light: "/audio/light.mp3",
  crowd: "/audio/crowd.mp3",
} as const;

export type ShowSoundName = keyof typeof SHOW_FILES;

/** How loud the show is: the show bus, a clunk against the bus, and the crowd at its peak (1 of the bus). */
export const SHOW_LEVELS = { bus: 0.8, light: 0.6, crowd: 1 } as const;

/**
 * One sound in a show, in seconds from the show's start (the same clock as the animations).
 * A light is a single clunk. The crowd rises over `fadeIn` to full, holds until `holdUntil`, then falls over `fadeOut`.
 */
export interface ShowCue {
  at: number;
  sound: ShowSoundName;
  fadeIn?: number;
  holdUntil?: number;
  fadeOut?: number;
}

export interface ShowOptions {
  /** The Intro's layout: the stage (desktop, from 1200px) or the column (below it). */
  tier?: "desktop" | "mobile";
  /** The Home's multiplier on every beat (its `--pace`); 0 is reduced motion, which has no show. The Intro ignores it. */
  pace?: number;
}

/** How long the Home crowd takes to fall away after its hold, in seconds at full pace. */
const LANDING_FADE_OUT = 1.5;
/** How long the Intro crowd takes to fall away after the call to action, in seconds. */
const INTRO_FADE_OUT = 1.2;

const round = (seconds: number) => Math.round(seconds * 1e6) / 1e6;

/** The Home's cheer (a return visit): the crowd alone, every beat times the pace. A first visit is silent. */
function landingShow({ pace = 1 }: ShowOptions): ShowCue[] {
  if (pace <= 0) return [];
  const b = LANDING_BEATS;
  return [
    {
      at: round(b.field * pace),
      sound: "crowd",
      fadeIn: round((b.name - b.field) * pace),
      holdUntil: round(b.ctas * pace),
      fadeOut: round(LANDING_FADE_OUT * pace),
    },
  ];
}

function introShow({ tier = "desktop" }: ShowOptions): ShowCue[] {
  const lights = (start: number, gap: number): ShowCue[] =>
    Array.from({ length: INTRO_BANKS[tier] }, (_, i) => ({
      at: round(start + i * gap),
      sound: "light",
    }));
  if (tier === "mobile") {
    const t = INTRO_BEATS.mobile;
    return [
      ...lights(t.banks, t.bankGap),
      {
        at: t.name,
        sound: "crowd",
        fadeIn: round(t.title - t.name),
        holdUntil: t.cta,
        fadeOut: INTRO_FADE_OUT,
      },
    ];
  }
  const t = INTRO_BEATS.desktop;
  return [
    ...lights(t.banks, t.bankGap),
    {
      at: t.name,
      sound: "crowd",
      fadeIn: round(t.flash - t.name),
      holdUntil: t.cta,
      fadeOut: INTRO_FADE_OUT,
    },
  ];
}

/**
 * The sound of a show as a list of cues, worked out from the same beat tables the animations use (never from
 * timers of its own). The Intro: a clunk as each floodlight bank comes on, then the crowd swelling as the name
 * appears. The Home: the crowd alone, on a return visit.
 */
export function showSchedule(kind: "landing" | "intro", options: ShowOptions = {}): ShowCue[] {
  return kind === "landing" ? landingShow(options) : introShow(options);
}

/** When a cue's sound is over, in seconds from the show's start (a clunk has no envelope of its own: it plays out). */
export function cueEnd(cue: ShowCue): number {
  const rise = cue.at + (cue.fadeIn ?? 0);
  return Math.max(rise, cue.holdUntil ?? rise) + (cue.fadeOut ?? 0);
}
