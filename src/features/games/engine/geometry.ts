/** A point in a game's drawing space. */
export interface Point {
  x: number;
  y: number;
}

/** The point at `t` (0 to 1) on the straight line from `a` to `b`. */
export const lerp = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/** The point at `t` (0 to 1) on the quadratic curve from `from` to `to`, bowed toward `via`. */
export function quad(from: Point, via: Point, to: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * from.x + 2 * u * t * via.x + t * t * to.x,
    y: u * u * from.y + 2 * u * t * via.y + t * t * to.y,
  };
}
