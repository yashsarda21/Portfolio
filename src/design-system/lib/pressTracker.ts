import { useEffect, useState } from "react";

/** A press that moves farther than this is a drag, not a click. */
export const DRAG_PX = 4;

/**
 * Bookkeeping for one press: where it began, whether it has become a drag, and whether the click that follows
 * its release should be swallowed. Shared by the card tilt and the arc orbit.
 */
export class PressTracker {
  private origin: { x: number; y: number } | null = null;
  private moved = false;
  private timer: ReturnType<typeof setTimeout> | undefined;

  get active(): boolean {
    return this.origin !== null;
  }
  get dragging(): boolean {
    return this.moved;
  }
  begin(x: number, y: number) {
    clearTimeout(this.timer);
    this.origin = { x, y };
    this.moved = false;
  }
  /** Feeds a move of the pressed pointer; true once the press has become a drag. */
  track(x: number, y: number): boolean {
    const o = this.origin;
    if (o && !this.moved && Math.hypot(x - o.x, y - o.y) > DRAG_PX) this.moved = true;
    return this.moved;
  }
  /** A press whose release was never seen (the button went up elsewhere): forget it, drag and all. */
  forget() {
    this.origin = null;
    this.moved = false;
  }
  /** The press is over. The click follows the pointer-up in the same task, so by the next tick the drag is over too. */
  end() {
    this.origin = null;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.moved = false;
    }, 0);
  }
  /** True once if the press that just ended was a drag (call it from the click handler). */
  consumeDrag(): boolean {
    const was = this.moved;
    this.moved = false;
    return was;
  }
  dispose() {
    clearTimeout(this.timer);
  }
}

export function usePressTracker(): PressTracker {
  const [tracker] = useState(() => new PressTracker());
  useEffect(() => () => tracker.dispose(), [tracker]);
  return tracker;
}
