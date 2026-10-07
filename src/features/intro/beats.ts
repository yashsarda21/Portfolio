/** Which of the two intros plays: the stage (desktop and tablet, L1) or the phone column (L6). */
export type IntroTier = "desktop" | "mobile";

const DESKTOP = {
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
} as const;

/** The names a tier's table may use. The stage uses all of them; the phone a subset. */
export type Beat = keyof typeof DESKTOP;

/**
 * Every beat of the Player Introduction in seconds. Desktop is read off the Intro board (Intro.dc.html's
 * animation delays); mobile is the 2 s phone cut (README §9, spec §12). The `*Gap` entries are spacings
 * between repeated parts (banks, ghosts, letters, tagline pieces), not moments, so they get no label.
 */
export const INTRO_BEATS = {
  desktop: DESKTOP,
  mobile: {
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
  },
} as const satisfies Record<IntroTier, Partial<Record<Beat, number>>>;

/**
 * How long each reveal lasts, as a multiple of the board's durations. The phone beats are packed into 2 s, so
 * its reveals run at 70% (otherwise the last one would end past the 2 s the README gives it).
 */
export const INTRO_TEMPO: Record<IntroTier, number> = { desktop: 1, mobile: 0.7 };

/** True for a spacing (`bankGap`, `letterGap`, ...) rather than a moment. */
export function isGap(key: string): boolean {
  return key.endsWith("Gap");
}
