/** 0 → 1 → 0: a marker that sweeps the track one way every `periodMs` (the artboards' `alternate` sweep). */
export function pingPong(elapsedMs: number, periodMs: number): number {
  const t = (((elapsedMs / periodMs) % 2) + 2) % 2;
  return t <= 1 ? t : 2 - t;
}

export interface GameClock {
  start(): void;
  pause(): void;
  resume(): void;
  elapsed(): number;
  running(): boolean;
}

/** Game time: starts at 0, stands still while paused (a hidden tab), so the meter and the judge read the same value. */
export function createGameClock(now: () => number = () => performance.now()): GameClock {
  let origin = 0;
  let frozen: number | null = 0;
  return {
    start() {
      origin = now();
      frozen = null;
    },
    pause() {
      if (frozen === null) frozen = now() - origin;
    },
    resume() {
      if (frozen !== null) {
        origin = now() - frozen;
        frozen = null;
      }
    },
    elapsed() {
      return frozen ?? now() - origin;
    },
    running() {
      return frozen === null;
    },
  };
}
