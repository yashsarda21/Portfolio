import { useEffect, useRef } from "react";

export interface Timers {
  /** Runs `fn` once, `ms` from now, unless `clear()` or leaving comes first. */
  after(ms: number, fn: () => void): void;
  /** Cancels every pending timer (a rematch must not hear the last game's). */
  clear(): void;
}

/** A game's timers, all cancelled together: on `clear()` and when the screen unmounts. */
export function useTimers(): Timers {
  const api = useRef<Timers>(null);
  if (!api.current) {
    const pending = new Set<ReturnType<typeof setTimeout>>();
    api.current = {
      after(ms, fn) {
        const id = setTimeout(() => {
          pending.delete(id);
          fn();
        }, ms);
        pending.add(id);
      },
      clear() {
        for (const id of pending) clearTimeout(id);
        pending.clear();
      },
    };
  }
  const timers = api.current;
  useEffect(() => timers.clear, [timers]);
  return timers;
}
