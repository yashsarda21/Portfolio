import type { Rect } from "./visual";

/**
 * The areas the Intro parity tests leave out for D-5 (spec 11.4): the banks hang lower (y 76, the artboard's
 * 34 and 20), the board starts 40px lower (y 136, ends at 638 as drawn), and the figure moves down with its top
 * edge. Design px on the 1440x900 board. The name, tagline, title, footer, WELCOME and the CTA are drawn where
 * the artboard has them and are compared; the HUD's own boxes are compared too, except where the artboard
 * draws a bank behind SKIP INTRO. Measured with these (and the commentary mask): 0.18% of pixels differ.
 */
export const INTRO_D5_MASKS: Rect[] = [
  // The band above the board where the lamps, their glow and the beams' tops were and are, around the HUD's
  // controls (the logo at x 36 to 76 and REPLAY / SKIP INTRO from x 1180 stay compared): above the HUD, between
  // the logo and REPLAY, beside the two ends, and from the HUD's foot to the old board's header (y 60 to 200).
  { x: 0, y: 0, width: 1440, height: 16 },
  { x: 76, y: 16, width: 1104, height: 44 },
  { x: 0, y: 16, width: 36, height: 44 },
  { x: 1404, y: 16, width: 36, height: 44 },
  { x: 0, y: 60, width: 1440, height: 140 },
  // The artboard's right large bank, seen through SKIP INTRO's glass (x 1248 to 1360, y 34 to 78).
  { x: 1248, y: 34, width: 112, height: 26 },
  // The figure, 40px lower: head and shoulders (old place y 150 to 580; the footer hides the new place's foot).
  { x: 920, y: 150, width: 220, height: 270 },
  { x: 750, y: 410, width: 545, height: 170 },
];
