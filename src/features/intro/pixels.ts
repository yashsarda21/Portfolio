import { seeded } from "@/lib/seeded";

/** The colours the flying pixels use, as design tokens (never raw colours). */
export type PixelColor = "volt" | "led" | "warm";

export interface IntroPixel {
  /** Where the pixel starts, inside the board (design px). */
  x: number;
  y: number;
  /** Where its dot sits relative to that point. */
  dx: number;
  dy: number;
  /** Dot size in px: 3 or 5. */
  size: 3 | 5;
  color: PixelColor;
  /** When it sets off, in seconds on the intro clock (2.85 to 3.35). */
  delay: number;
}

const COLORS: readonly PixelColor[] = ["volt", "volt", "led", "warm"];

/**
 * The 90 pixels that fly into the name, the artboard's seeded field (Intro.dc.html renderVals, seed 7, the same
 * linear congruential generator): the same call order, so the same numbers. The board's four colours are named
 * by token: its two volt entries, one led (near white) and one warm (amber).
 */
export function createPixels(seed = 7): IntroPixel[] {
  const rnd = seeded(seed);
  return Array.from({ length: 90 }, () => {
    const x = Math.round(60 + rnd() * 560);
    const y = Math.round(162 + rnd() * 100);
    const dx = Math.round(-420 + rnd() * 1100);
    const dy = Math.round(-150 + rnd() * 380);
    const size = rnd() > 0.7 ? 5 : 3;
    const color = COLORS[Math.floor(rnd() * COLORS.length)]!;
    const delay = Number((2.85 + rnd() * 0.5).toFixed(2));
    return { x, y, dx, dy, size, color, delay };
  });
}
