import type { GameLayout, Quality } from "../engine/types";

interface Point {
  x: number;
  y: number;
}
type Length = "yorker" | "good" | "short" | "full";

/**
 * The ball's line down the pitch in each layout's own drawing space (Cricket-Play 1440x900, Mobile-Game 390x844):
 * where it leaves your hand, where the tracer ends at the batter, and where a ball of each length lands. The tracer
 * the boards draw is the yorker's line; a shorter ball lands earlier on the same line, a full toss never lands.
 */
const LINE: Record<GameLayout, { release: Point; batter: Point; bounce: Record<Length, Point> }> = {
  stage: {
    release: { x: 714, y: 836 },
    batter: { x: 724, y: 326 },
    bounce: {
      yorker: { x: 719, y: 353 },
      good: { x: 719, y: 382 },
      short: { x: 717, y: 520 },
      full: { x: 724, y: 326 },
    },
  },
  column: {
    release: { x: 192, y: 640 },
    batter: { x: 195, y: 218 },
    bounce: {
      yorker: { x: 195, y: 236 },
      good: { x: 195, y: 262 },
      short: { x: 194, y: 380 },
      full: { x: 195, y: 218 },
    },
  },
};

/** The Hawk-Eye line each board draws (the yorker's), in the layout's drawing space; the stage also rings the yorker's bounce. */
export const TRACER = {
  stage: {
    d: "M714 836 Q 716 560 719 352 Q 721 340 724 326",
    viewBox: "0 0 1440 900",
    bounce: { cx: 719, cy: 353, rx: 12, ry: 4, tone: "floodlight" },
  },
  column: {
    d: "M192 640 Q 194 420 195 236 Q 195 226 195 218",
    viewBox: "0 0 390 844",
    bounce: undefined,
  },
} as const;

/** Which length a ball was: the cursor left of the middle (`at` under .5) is short of the yorker, right of it full. */
function lengthOf(q: Quality, at: number): Length {
  if (q === "perfect") return "yorker";
  if (q === "good") return at < 0.5 ? "good" : "yorker";
  return at < 0.5 ? "short" : "full";
}

/** Where a ball of this quality lands, released with the cursor at `at` (0 to 1). */
export function bounceOf(layout: GameLayout, q: Quality, at: number): Point {
  return LINE[layout].bounce[lengthOf(q, at)];
}

/** Share of the flight spent reaching the bounce; the rest is the ball rising to the bat. */
const BOUNCE_AT = 0.7;

const lerp = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/** The ball's place at `progress` (0 to 1) of its flight: your hand, then the bounce, then the batter. */
export function ballAt(layout: GameLayout, bounce: Point, progress: number): Point {
  const { release, batter } = LINE[layout];
  return progress < BOUNCE_AT
    ? lerp(release, bounce, progress / BOUNCE_AT)
    : lerp(bounce, batter, (progress - BOUNCE_AT) / (1 - BOUNCE_AT));
}
