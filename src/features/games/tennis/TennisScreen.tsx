import { useEffect, useMemo, useRef } from "react";
import { content, ui } from "@/content";
import { MEDIA } from "@/lib/breakpoints";
import { EASE, loadGsap } from "@/lib/motion";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useAudio } from "@/shell/audio";
import { useCommentary } from "@/shell/commentary";
import { ROUTES } from "@/shell/routes";
import { autoRallyTimes, VERDICT_MS } from "../engine/beats";
import type { GameLayout } from "../engine/types";
import { useFlight } from "../engine/useFlight";
import { useGameClock } from "../engine/useGameClock";
import { useGameKeys } from "../engine/useGameKeys";
import { useMatchResult } from "../engine/useMatchResult";
import { useRun } from "../engine/useRun";
import { useTimers } from "../engine/useTimers";
import { returnAt, serveDrawn } from "./flight";
import {
  newServe,
  playReturn,
  TELL_MS,
  TENNIS_AUTO_SHARE,
  TENNIS_BEATS,
  TENNIS_SERVES,
  TENNIS_START,
  tennisOver,
  tennisWinner,
  windowFor,
  type Side,
  type TennisState,
} from "./referee";
import { TennisPage } from "./TennisPage";
import { buildTennisView, LIVE_PHASES, type TennisPhase } from "./view";

interface Run {
  game: TennisState;
  phase: TennisPhase;
  offerHighlight: boolean;
  /** The side the last return was sent to (null: none, or the serve went by). */
  shot: Side | null;
}
const START: Run = { game: TENNIS_START, phase: "ready", offerHighlight: false, shot: null };

/**
 * The tennis route: it holds the game, runs the serve's clock, judges a pick by it and walks the phases (ready, tell,
 * toss, window, called, verdict, end). The referee decides, the view builder words it, the page draws it. One input is
 * exactly one return: the phase is read from a ref the moment a side is picked, so a key repeat, a click and a key in
 * the same frame, or a pick during the call cannot return a second. The hit is the game clock's time when the window
 * opens, and a pick is judged by the same clock the serve's line is drawn from. A hidden tab ends the serve in play
 * and serves again when it is visible: time spent away is never judged (G2).
 */
export function TennisScreen() {
  const { run, latest, commit } = useRun<Run>(START);
  const root = useRef<HTMLElement>(null);
  const balls = {
    stage: useRef<SVGCircleElement>(null),
    column: useRef<SVGCircleElement>(null),
  };
  const flight = useFlight();

  const desktop = useMediaQuery(MEDIA.lg);
  const reduced = useMediaQuery(MEDIA.reducedMotion);
  const layout: GameLayout = desktop ? "stage" : "column";
  const audio = useAudio();
  const { say } = useCommentary();
  const timers = useTimers();
  const { save } = useMatchResult("tennis");

  // The serve in play: when the window opened on the game clock, and how long it is (the layout it began in).
  const hitAt = useRef<number | null>(null);
  const serve = useRef({ windowMs: 0, layout });
  const clock = useGameClock(root, {
    cssVar: "--serve",
    value: (t) => serveDrawn(t, hitAt.current, serve.current.windowMs),
    running: LIVE_PHASES.includes(run.phase) && !reduced,
  });

  // What the timers and the ball in the air need when they fire: this render's, not the one they were made in.
  const live = useRef({ desktop, audio, say, save, layout, reduced });
  useEffect(() => {
    live.current = { desktop, audio, say, save, layout, reduced };
  });

  const view = useMemo(
    () =>
      buildTennisView(content, ui, ROUTES, run.game, {
        phase: run.phase,
        offerHighlight: run.offerHighlight,
      }),
    [run],
  );

  /** The tracers read their reveal from variables on the root: put them back to nothing drawn. */
  const clearLines = () => {
    for (const name of ["--serve", "--return-left", "--return-right"]) {
      root.current?.style.setProperty(name, "0");
    }
  };

  /** The visitor's return, from your hand to the middle of the zone, along the line drawn for it. Nothing but transform and opacity moves. */
  const fly = (side: Side) => {
    const ball = balls[live.current.layout].current;
    const el = root.current;
    flight.play((gsap) => {
      if (!ball || !el) return () => {};
      const progress = { value: 0 };
      const place = () => {
        const at = returnAt(side, progress.value);
        ball.style.transform = `translate(${at.x}px, ${at.y}px)`;
        el.style.setProperty(`--return-${side}`, String(progress.value));
      };
      place();
      ball.style.opacity = "1";
      const tween = gsap.to(progress, {
        value: 1,
        duration: TENNIS_BEATS.flightMs / 1000,
        ease: EASE.swing,
        onUpdate: place,
        onComplete: () => {
          ball.style.opacity = "0";
        },
      });
      return () => {
        tween.kill();
        ball.style.opacity = "0";
      };
    });
  };

  /** A return has been judged: the call, what it unlocked, the sound and the line; the game's end is saved at once (G8). */
  const land = (next: TennisState, side: Side | null) => {
    const over = tennisOver(next);
    const after = buildTennisView(content, ui, ROUTES, next, {
      phase: "called",
      offerHighlight: false,
    });
    const last = next.returns.at(-1);
    const now = live.current;
    if (last && last.q !== "miss") now.audio.play("net");
    if (now.desktop) now.say(after.comm, { interrupt: true });
    // The serve's line runs on to its end, and the ball goes back along its own.
    root.current?.style.setProperty("--serve", "1");
    if (side && !now.reduced) fly(side);
    if (!over) {
      commit({ game: next, phase: "called", shot: side });
      timers.after(TENNIS_BEATS.callMs, beginServe);
      return;
    }
    const { offerHighlight } = now.save({ score: after.saved, winner: tennisWinner(next)! });
    commit({ game: next, phase: "verdict", offerHighlight, shot: side });
    timers.after(VERDICT_MS, () => commit({ phase: "end" }));
  };

  /** The window is over and nobody picked: Yash's serve was an ace. */
  const timeOut = () => judge(null);

  /** The window opens at Yash's hit: the clock's time now is the zero every pick is measured from. */
  const openWindow = () => {
    hitAt.current = clock.elapsed();
    commit({ phase: "window" });
    timers.after(serve.current.windowMs, timeOut);
  };

  /** Serve: the open side is drawn and lit (the tell), then the toss, then the hit (G5). */
  function beginServe() {
    const next = newServe(latest.current.game, Math.random);
    if (!next.serve) return;
    hitAt.current = null;
    serve.current = {
      windowMs: windowFor(next.returns.length, live.current.layout),
      layout: live.current.layout,
    };
    clearLines();
    commit({ game: next, phase: "tell", shot: null });
    timers.after(TELL_MS, () => {
      commit({ phase: "toss" });
      timers.after(next.serve!.tossMs, openWindow);
    });
  }

  /** One input: judge the pick by the clock the serve was drawn from. A pick before the hit is TOO EARLY. */
  function judge(side: Side | null) {
    const cur = latest.current;
    if (!LIVE_PHASES.includes(cur.phase) || !cur.game.serve) return;
    timers.clear();
    const atMs =
      side === null
        ? serve.current.windowMs + 1
        : cur.phase === "window" && hitAt.current !== null
          ? clock.elapsed() - hitAt.current
          : -1;
    land(playReturn(cur.game, { side, atMs }, serve.current.layout, Math.random), side);
  }

  /** G10: with reduced motion the game plays itself, no movement: each return lands on the open side at 60 % of its window. */
  const playRally = () => {
    let game = TENNIS_START;
    autoRallyTimes(TENNIS_SERVES).forEach((at) => {
      timers.after(at, () => {
        const served = newServe(game, Math.random);
        const side = served.serve!.open;
        const where = live.current.layout;
        game = playReturn(
          served,
          { side, atMs: windowFor(served.returns.length, where) * TENNIS_AUTO_SHARE },
          where,
          Math.random,
        );
        land(game, side);
      });
    });
  };

  /** The first serve, a beat after arriving or after a rematch. */
  const startPlay = () => {
    if (live.current.reduced) playRally();
    else timers.after(TELL_MS, beginServe);
  };

  const again = () => {
    timers.clear();
    flight.stop();
    hitAt.current = null;
    clearLines();
    commit(START);
    if (desktop) say(content.commentary.entrance[0]!, { interrupt: true });
    startPlay();
  };

  useGameKeys(
    { down: { ArrowLeft: () => judge("left"), ArrowRight: () => judge("right") } },
    { active: LIVE_PHASES.includes(run.phase) && !reduced },
  );

  // The arrival line, on the stage only (phones are silent, L11).
  const arrived = useRef(false);
  useEffect(() => {
    if (!desktop || arrived.current) return;
    arrived.current = true;
    say(content.commentary.entrance[0]!);
  }, [desktop, say]);

  // Warm GSAP while the visitor reads the board, so the first return flies on time.
  useEffect(() => {
    if (!reduced) void loadGsap().catch(() => {});
  }, [reduced]);

  // The game starts on arrival, and again when the setting changes. Leaving ends it (and any ball in the air).
  useEffect(() => {
    startPlay();
    return () => {
      timers.clear();
      flight.stop();
      commit(START);
    };
    // The game starts when the setting is known; its handlers are the latest by ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // G2: a hidden tab ends the serve in play and serves again when it is visible; time away is never judged.
  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    const onVisibility = () => {
      const cur = latest.current;
      if (document.visibilityState === "hidden") {
        if (!LIVE_PHASES.includes(cur.phase)) return;
        timers.clear();
        hitAt.current = null;
        clearLines();
        commit({ game: { ...cur.game, serve: null }, phase: "ready" });
        cancelled = true;
      } else if (cancelled) {
        cancelled = false;
        if (latest.current.phase === "ready") beginServe();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // Its handlers are the latest by ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return (
    <TennisPage
      view={view}
      phase={run.phase}
      reduced={reduced}
      shot={run.shot}
      onPick={judge}
      onAgain={again}
      rootRef={root}
      ballRefs={balls}
    />
  );
}
