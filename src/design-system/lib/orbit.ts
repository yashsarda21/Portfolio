/** How far a drag of `dx` px turns a plate `width` px wide: proportional, at most `max` degrees either way. */
export function orbitAngle(dx: number, width: number, max: number): number {
  if (!(width > 0)) return 0;
  const angle = Math.max(-max, Math.min(max, (dx / (width / 2)) * max));
  return angle === 0 ? 0 : angle; // -0 → 0
}
