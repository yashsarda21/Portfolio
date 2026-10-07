/** Frame index for steps(frames, jump-none): 0 at the start, frames-1 at the end, equal holds between. */
export function frameAt(progress: number, frames: number): number {
  if (progress <= 0) return 0;
  return Math.min(frames - 1, Math.floor(progress * frames));
}

/** background-position-x for a frame, as a percentage of the strip (jump-none ends at 100%). */
export function framePosition(frame: number, frames: number): string {
  return `${(frame / (frames - 1)) * 100}% 0`;
}
