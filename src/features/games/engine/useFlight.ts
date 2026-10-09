import type { gsap as Gsap } from "gsap";
import { useEffect, useRef } from "react";
import { loadGsap } from "@/lib/motion";

/**
 * The tween a game's ball flies on. GSAP is loaded on demand (never at the top of a module); `play` hands it to
 * `build`, which makes the tween and returns how to kill it. Starting another flight, `stop()`, or leaving ends the
 * one in the air, and a flight whose GSAP arrives after that is never started: nothing of it lands later.
 * If GSAP does not load, `onFail` runs (the ball still lands, only without its flight).
 */
export function useFlight() {
  const flight = useRef({ id: 0, kill: () => {} });

  const stop = () => {
    flight.current.id += 1;
    flight.current.kill();
    flight.current.kill = () => {};
  };

  const play = (build: (gsap: typeof Gsap) => () => void, onFail?: () => void) => {
    const id = ++flight.current.id;
    flight.current.kill();
    flight.current.kill = () => {};
    void loadGsap()
      .then((gsap) => {
        if (id === flight.current.id) flight.current.kill = build(gsap);
      })
      .catch(() => {
        if (id === flight.current.id) onFail?.();
      });
  };

  // Leaving ends any flight in the air. `stop` is made fresh each render but only touches the ref.
  useEffect(() => stop, []);
  return { play, stop };
}
