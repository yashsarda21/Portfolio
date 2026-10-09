interface Point {
  x: number;
  y: number;
}

/**
 * The shuttle's arc as Badminton-Play draws it, in the stage's design space (1440x900): from your ring, over the net,
 * to Yash's. The column draws the same arc in the same space (its backdrop crops the hall to `GAME_COURT_VIEW.hall`
 * and slices it to the width), so the shuttle flies the court's own line at any width.
 */
export const ARC = {
  from: { x: 560, y: 770 },
  via: { x: 640, y: 40 },
  to: { x: 790, y: 330 },
  d: "M560 770 Q 640 40 790 330",
} as const;

/** Where the board draws the shuttle while it waits for a rally: above the arc, in the lamp's beam. */
export const PARKED: Point = { x: 676, y: 168 };

/** The shuttle's place at `progress` (0 to 1) along the arc. */
export function shuttleAt(progress: number): Point {
  const { from, via, to } = ARC;
  const u = 1 - progress;
  return {
    x: u * u * from.x + 2 * u * progress * via.x + progress * progress * to.x,
    y: u * u * from.y + 2 * u * progress * via.y + progress * progress * to.y,
  };
}

/** The CSS transform that takes the parked shuttle to `progress` along the arc (a `<g>` is moved by `transform` only). */
export function shuttleTransform(progress: number): string {
  const at = shuttleAt(progress);
  return `translate(${at.x - PARKED.x}px, ${at.y - PARKED.y}px)`;
}

/** The centre of Yash's ring on the board (its 56x14 content box and 2px border, at 762,334), in the stage's design space. */
export const YASH_RING = { x: 792, y: 343 } as const;
