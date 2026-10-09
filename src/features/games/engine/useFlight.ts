import type { gsap as Gsap } from "gsap";
import { useEffect, useRef } from "react";
import { EASE, loadGsap } from "@/lib/motion";

/** A ball's flight along its line, from progress 0 to 1. */
interface Flight {
  ms: number;
  /** Puts the ball where `progress` (0 to 1) is, by transform only; called with 0 before the first frame. */
  place: (progress: number) => void;
  /** Right after the ball is placed at 0: show it. */
  start?: () => void;
  /** When the flight is over or ended early (stop, another flight, leaving): put the ball away. */
  end?: () => void;
  /** When the flight has run its whole way (not when it was cut short). */
  done?: () => void;
}

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

  /** The ball's flight on the swing ease: `place` each frame, `done` at the end. If GSAP does not load, `done` still runs. */
  const fly = ({ ms, place, start, end, done }: Flight, onFail: () => void = () => done?.()) =>
    play((gsap) => {
      const progress = { value: 0 };
      place(0);
      start?.();
      const tween = gsap.to(progress, {
        value: 1,
        duration: ms / 1000,
        ease: EASE.swing,
        onUpdate: () => place(progress.value),
        onComplete: () => {
          end?.();
          done?.();
        },
      });
      return () => {
        tween.kill();
        end?.();
      };
    }, onFail);

  // Leaving ends any flight in the air. `stop` is made fresh each render but only touches the ref.
  useEffect(() => stop, []);
  return { play, fly, stop };
}
