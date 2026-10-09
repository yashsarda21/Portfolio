import { useCallback, useEffect, useRef, type RefObject } from "react";
import { createGameClock, type GameClock } from "./clock";

interface GameClockOptions {
  /** The variable on the target the clock writes: the timing meter reads `--meter`, the power meter `--power`, tennis's serve line `--serve`. */
  cssVar: "--meter" | "--power" | "--serve";
  /** The 0 to 1 position for a game time in ms. */
  value: (elapsedMs: number) => number;
  running: boolean;
}

const hidden = () => document.visibilityState === "hidden";

/**
 * The one clock of a game (G2). While `running`, a frame loop writes `value(elapsed)` to `target`'s CSS variable,
 * and `elapsed()` is the same clock the judge reads, so what is drawn is what is judged. A hidden tab pauses it;
 * `running: false` freezes it (the variable keeps its last value). `restart()` sets it back to 0.
 */
export function useGameClock(
  target: RefObject<HTMLElement | null>,
  { cssVar, value, running }: GameClockOptions,
): { elapsed(): number; restart(): void } {
  const clock = useRef<GameClock>(null);
  const live = useRef({ cssVar, value, running });
  const get = () => (clock.current ??= createGameClock());

  useEffect(() => {
    live.current = { cssVar, value, running };
  });

  useEffect(() => {
    if (!running) return;
    const c = get();
    // A new clock stands at 0, a frozen one carries on from where it froze.
    if (!hidden()) c.resume();

    let frame = 0;
    const tick = () => {
      const { cssVar: name, value: at } = live.current;
      target.current?.style.setProperty(name, String(at(get().elapsed())));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const onVisibility = () => (hidden() ? get().pause() : get().resume());
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      get().pause();
    };
  }, [running, target]);

  const restart = useCallback(() => {
    clock.current = createGameClock();
    if (live.current.running && !hidden()) clock.current.resume();
  }, []);

  const elapsed = useCallback(() => get().elapsed(), []);
  return { elapsed, restart };
}
