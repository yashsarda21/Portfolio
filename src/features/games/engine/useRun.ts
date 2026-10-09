import { useCallback, useRef, useState } from "react";

/**
 * A game's run (its state and its phase), kept twice: in React state for drawing, and in `latest`, a ref that is
 * already up to date the moment `commit` returns. Timers and input handlers read `latest`, so one input is one
 * input: the phase a handler changes is seen by the next handler even before the next render.
 */
export function useRun<T extends object>(start: T) {
  const [run, setRun] = useState(start);
  const latest = useRef(run);
  const commit = useCallback((patch: Partial<T>) => {
    latest.current = { ...latest.current, ...patch };
    setRun(latest.current);
  }, []);
  return { run, latest, commit };
}
