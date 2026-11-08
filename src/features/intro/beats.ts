/** Which of the two intros plays: the stage (desktop, from 1200px, L1) or the column (phones and tablets, L6). */
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
 * animation delays); mobile is the 3 s phone cut (D-6, spec 11.4: the README's 2 s cut, every beat times 1.5). The `*Gap` entries are spacings
 * between repeated parts (banks, ghosts, letters, tagline pieces), not moments, so they get no label.
 */
export const INTRO_BEATS = {
  desktop: DESKTOP,
  mobile: {
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
  },
} as const satisfies Record<IntroTier, Partial<Record<Beat, number>>>;

/** How many floodlight banks each layout draws (the stage has bank-1..4, the phone column bank-1..2); the sound has one clunk per bank. */
export const INTRO_BANKS: Record<IntroTier, number> = { desktop: 4, mobile: 2 };

/**
 * How long each reveal lasts, as a multiple of the board's durations. Both tiers play them as drawn: the phone's
 * beats are the 2 s cut's spread to 3 s (D-6), so its reveals no longer need squeezing.
 */
export const INTRO_TEMPO: Record<IntroTier, number> = { desktop: 1, mobile: 1 };

/** True for a spacing (`bankGap`, `letterGap`, ...) rather than a moment. */
export function isGap(key: string): boolean {
  return key.endsWith("Gap");
}
