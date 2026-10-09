import { useEffect, useMemo, useRef, useState } from "react";
import { content, ui } from "@/content";
import { MEDIA } from "@/lib/breakpoints";
import { EASE, loadGsap } from "@/lib/motion";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useAudio } from "@/shell/audio";
import { useCommentary } from "@/shell/commentary";
import { ROUTES } from "@/shell/routes";
import { autoRallyTimes, VERDICT_MS } from "../engine/beats";
import { pingPong } from "../engine/clock";
import type { GameLayout } from "../engine/types";
import { useGameClock } from "../engine/useGameClock";
import { useGameKeys } from "../engine/useGameKeys";
import { useMatchResult } from "../engine/useMatchResult";
import { useTimers } from "../engine/useTimers";
import { ballAt, bounceOf } from "./flight";
import { CricketPage } from "./CricketPage";
import {
  bowl,
  CRICKET_AUTO,
  CRICKET_BEATS,
  CRICKET_PERIOD_MS,
  CRICKET_START,
  cricketOver,
  cricketWinner,
  lengthQuality,
  type CricketState,
} from "./referee";
import { buildCricketView, type CricketPhase } from "./view";

interface Run {
  game: CricketState;
  phase: CricketPhase;
  offerHighlight: boolean;
}
const START: Run = { game: CRICKET_START, phase: "ready", offerHighlight: false };

/**
 * The cricket route: it holds the over, runs the meter's clock, judges a release by it and walks the phases
 * (ready, flight, called, verdict, end). The referee decides, the view builder words it, the page draws it.
 * One input is exactly one ball: the phase is read from a ref the moment a ball is bowled, so a key repeat, a
 * click and a key in the same frame, or a press during the flight cannot bowl a second.
 */
export function CricketScreen() {
  const [run, setRun] = useState<Run>(START);
  // The latest run, readable by timers and handlers that were made before the last render.
  const latest = useRef(run);
  const root = useRef<HTMLElement>(null);
  const balls = { stage: useRef<HTMLSpanElement>(null), column: useRef<HTMLSpanElement>(null) };
  const flight = useRef({ id: 0, kill: () => {} });

  const desktop = useMediaQuery(MEDIA.lg);
  const reduced = useMediaQuery(MEDIA.reducedMotion);
  const layout: GameLayout = desktop ? "stage" : "column";
  const audio = useAudio();
  const { say } = useCommentary();
  const timers = useTimers();
  const { save } = useMatchResult("cricket");
  const clock = useGameClock(root, {
    cssVar: "--meter",
    value: (t) => pingPong(t, CRICKET_PERIOD_MS),
    running: run.phase === "ready" && !reduced,
  });

  // What the timers and the ball in the air need when they fire: this render's, not the one they were made in.
  const live = useRef({ desktop, audio, say, save });
  useEffect(() => {
    live.current = { desktop, audio, say, save };
  });

  const view = useMemo(
    () =>
      buildCricketView(content, ui, ROUTES, run.game, {
        phase: run.phase,
        offerHighlight: run.offerHighlight,
      }),
    [run],
  );

  const commit = (patch: Partial<Run>) => {
    latest.current = { ...latest.current, ...patch };
    setRun(latest.current);
  };

  /** Stops a ball in the air (a rematch, or leaving): nothing of it lands later. */
  const stopFlight = () => {
    flight.current.id += 1;
    flight.current.kill();
    flight.current.kill = () => {};
  };

  /** A ball has been bowled and judged: the call, what it unlocked, the sound and the line; the over's end is saved at once (G8). */
  const land = (next: CricketState) => {
    const over = cricketOver(next);
    const after = buildCricketView(content, ui, ROUTES, next, {
      phase: "called",
      offerHighlight: false,
    });
    const ball = next.balls.at(-1);
    const now = live.current;
    if (ball && ball.runs > 0) now.audio.play("bat");
    if (now.desktop) now.say(after.comm, { interrupt: true });
    if (!over) {
      commit({ game: next, phase: "called" });
      timers.after(CRICKET_BEATS.callMs, () => commit({ phase: "ready" }));
      return;
    }
    const { offerHighlight } = now.save({ score: after.saved, winner: cricketWinner(next)! });
    commit({ game: next, phase: "verdict", offerHighlight });
    timers.after(VERDICT_MS, () => commit({ phase: "end" }));
  };

  /** The ball from your hand to the bounce and on to the bat, along the tracer; then `done`. Nothing but transform and opacity moves. */
  const fly = (where: GameLayout, bounce: { x: number; y: number }, done: () => void) => {
    const ball = balls[where].current;
    const id = ++flight.current.id;
    void loadGsap()
      .then((gsap) => {
        if (id !== flight.current.id || !ball) return;
        const progress = { value: 0 };
        const place = () => {
          const at = ballAt(where, bounce, progress.value);
          ball.style.transform = `translate(${at.x}px, ${at.y}px)`;
        };
        place();
        ball.style.opacity = "1";
        const tween = gsap.to(progress, {
          value: 1,
          duration: CRICKET_BEATS.flightMs / 1000,
          ease: EASE.swing,
          onUpdate: place,
          onComplete: () => {
            ball.style.opacity = "0";
            done();
          },
        });
        flight.current.kill = () => {
          tween.kill();
          ball.style.opacity = "0";
        };
      })
      .catch(() => {
        // GSAP did not load: the ball still lands, only without its flight.
        if (id === flight.current.id) done();
      });
  };

  /** One input: judge the release by the clock the meter was drawn from, then fly the ball (G2, G4). */
  const release = () => {
    if (latest.current.phase !== "ready" || reduced) return;
    const at = pingPong(clock.elapsed(), CRICKET_PERIOD_MS);
    const quality = lengthQuality(at, layout);
    const next = bowl(latest.current.game, quality, Math.random);
    commit({ phase: "flight" });
    if (!desktop) navigator.vibrate?.(20);
    fly(layout, bounceOf(layout, quality, at), () => land(next));
  };

  /** G10: with reduced motion the over plays itself, no movement: its balls land at their beats, then the verdict. */
  const playOver = () => {
    let game = CRICKET_START;
    autoRallyTimes(CRICKET_AUTO.length).forEach((at, i) => {
      timers.after(at, () => {
        game = bowl(game, CRICKET_AUTO[i]!, Math.random);
        land(game);
      });
    });
  };

  const again = () => {
    timers.clear();
    stopFlight();
    commit(START);
    clock.restart();
    if (desktop) say(ui.games.cricket.comm.start, { interrupt: true });
    if (reduced) playOver();
  };

  useGameKeys(
    { down: { " ": release, Enter: release } },
    { active: run.phase === "ready" && !reduced },
  );

  // The arrival line, on the stage only (phones are silent, L11).
  const arrived = useRef(false);
  useEffect(() => {
    if (!desktop || arrived.current) return;
    arrived.current = true;
    say(ui.games.cricket.comm.start);
  }, [desktop, say]);

  // Warm GSAP while the visitor reads the board, so the first ball flies on time.
  useEffect(() => {
    if (!reduced) void loadGsap().catch(() => {});
  }, [reduced]);

  // Reduced motion: the over plays itself on arrival. Leaving, or the setting changing, ends it (and any ball in the air).
  useEffect(() => {
    if (!reduced) return;
    playOver();
    return () => {
      timers.clear();
      commit(START);
    };
    // The over starts when the setting turns on; its handlers are the latest by ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  useEffect(() => stopFlight, []);

  return (
    <CricketPage
      view={view}
      phase={run.phase}
      reduced={reduced}
      onBowl={release}
      onAgain={again}
      rootRef={root}
      ballRefs={balls}
    />
  );
}
