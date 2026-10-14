import { useEffect, useMemo, useRef } from "react";
import { MEDIA } from "@/lib/breakpoints";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useAudio } from "@/shell/audio";
import { useCommentary } from "@/shell/commentary";
import type { Venue } from "@/shell/matchRecord";
import { VERDICT_MS } from "./beats";
import type { GameLayout } from "./types";
import { useFlight } from "./useFlight";
import { useMatchResult, type EndFlags } from "./useMatchResult";
import { useRun } from "./useRun";
import { useTimers } from "./useTimers";

/** What every game's run holds, whatever else it adds: the game so far, the phase, and what the end offers (G9, F3). */
interface SessionRun extends EndFlags {
  game: unknown;
  phase: string;
}

/**
 * What the three games share in how they run: the run (state and phase, with the ref timers read), the timers, the
 * ball's flight, the match record, the viewport and reduced-motion answers, and the view built from the run. It also
 * owns the one way a game ends: `finish` saves the result the moment it is known, calls the verdict and, `VERDICT_MS`
 * later, the end. `build` must be the same function each render (a module's own).
 */
export function useGameSession<R extends SessionRun, V>({
  venue,
  start,
  build,
}: {
  venue: Venue;
  start: R;
  /** The game's view builder, with the content, the copy and the routes already given. */
  build: (game: R["game"], at: { phase: R["phase"] } & EndFlags) => V;
}) {
  const { run, latest, commit } = useRun<R>(start);
  const flight = useFlight();
  const timers = useTimers();
  const { save } = useMatchResult(venue);

  const desktop = useMediaQuery(MEDIA.lg);
  const reduced = useMediaQuery(MEDIA.reducedMotion);
  const layout: GameLayout = desktop ? "stage" : "column";
  const audio = useAudio();
  const { say } = useCommentary();

  // What the timers and the ball in the air need when they fire: this render's, not the one they were made in.
  const live = useRef({ desktop, audio, say, save, layout, reduced });
  useEffect(() => {
    live.current = { desktop, audio, say, save, layout, reduced };
  });

  const view = useMemo(
    () =>
      build(run.game, {
        phase: run.phase,
        offerHighlight: run.offerHighlight,
        fullTime: run.fullTime,
      }),
    [run, build],
  );

  /**
   * The game is over: save the result (once, here, the moment it is known: G8), the crowd reacts, show the verdict, and `VERDICT_MS`
   * later the end buttons. `extra` is whatever else the run changes with it.
   */
  const finish = (
    next: R["game"],
    result: { score: string; form: number },
    extra: Partial<R> = {},
  ) => {
    const flags = live.current.save(result);
    live.current.audio.play("crowd");
    commit({ game: next, phase: "verdict", ...flags, ...extra } as unknown as Partial<R>);
    timers.after(VERDICT_MS, () => commit({ phase: "end" } as unknown as Partial<R>));
  };

  /** Nothing of the last game is left: its timers, its ball in the air, its run. */
  const reset = () => {
    timers.clear();
    flight.stop();
    commit(start);
  };

  /** A rematch: a clean start, then the game's own `restart`. */
  const again = (restart: () => void) => {
    reset();
    restart();
  };

  return {
    run,
    latest,
    commit,
    view,
    timers,
    flight,
    live,
    desktop,
    reduced,
    layout,
    audio,
    say,
    finish,
    reset,
    again,
  };
}

export type GameSession = ReturnType<typeof useGameSession>;

/**
 * Begins a game on arrival, and again whenever reduced motion changes. Each time, whatever the last one left is
 * cleaned up first (the timers, the ball in the air, the run), so a game in progress when the setting turns on can
 * never land into the one that replaces it (or save twice). Reduced motion: `play` is the game played by itself
 * (G10); otherwise `otherwise` starts the ordinary game, if it needs a start. Leaving cleans up too.
 */
export function useAutoRally(
  session: Pick<GameSession, "reduced" | "reset">,
  script: { play: () => void; otherwise?: () => void; reset?: () => void },
) {
  // The session's and the script's handlers are the latest by ref; only a change of the setting runs this again.
  const latest = useRef({ session, script });
  useEffect(() => {
    latest.current = { session, script };
  });

  const { reduced } = session;
  useEffect(() => {
    const now = latest.current;
    if (reduced) now.script.play();
    else now.script.otherwise?.();
    return () => {
      const { session: s, script: sc } = latest.current;
      s.reset();
      sc.reset?.();
    };
  }, [reduced]);
}
