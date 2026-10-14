import { quad, type Point } from "../engine/geometry";
import type { Side } from "./referee";

/**
 * Tennis-Play's drawing space is the stage's (`GAME_STAGE_VIEW`). The column draws the same court in the same space: its
 * backdrop crops this space to `GAME_COURT_VIEW.court` and slices it to the width, so the tracers and the ball stand on
 * the court at any width.
 */
/** The Hawk-Eye line the board draws: from Yash's hand, through the bounce, on past the receiver. */
export const SERVE = {
  d: "M736 290 Q 700 420 640 640 Q 600 720 560 790",
  bounce: { cx: 640, cy: 640, rx: 18, ry: 5, tone: "volt" },
} as const;

/** Where the serve ends and the return begins: the receiver's racket. */
const RECEIVER: Point = { x: 560, y: 790 };

/** The return: from the receiver to the middle of the zone it was picked for, bowing toward the court's middle. */
const RETURN: Record<Side, { via: Point; to: Point }> = {
  left: { via: { x: 590, y: 560 }, to: { x: 646, y: 376 } },
  right: { via: { x: 710, y: 560 }, to: { x: 795, y: 376 } },
};

/** The returned ball's line, as a path in the drawing space. */
export const returnPath = (side: Side): string => {
  const { via, to } = RETURN[side];
  return `M${RECEIVER.x} ${RECEIVER.y} Q ${via.x} ${via.y} ${to.x} ${to.y}`;
};

/** The returned ball's place at `progress` (0 to 1) along that line. */
export function returnAt(side: Side, progress: number): Point {
  const { via, to } = RETURN[side];
  return quad(RECEIVER, via, to, progress);
}

/** How far into its window the serve is at game time `elapsedMs`, for a window that began at `hitAt`: 0 before the hit, 1 once the window is over. */
export function serveDrawn(elapsedMs: number, hitAt: number | null, windowMs: number): number {
  if (hitAt === null) return 0;
  return Math.min(1, Math.max(0, (elapsedMs - hitAt) / windowMs));
}
