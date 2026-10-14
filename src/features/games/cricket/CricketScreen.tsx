import { useRef } from "react";
import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { autoRallyTimes } from "../engine/beats";
import { pingPong } from "../engine/clock";
import type { GameLayout } from "../engine/types";
import { useGameClock } from "../engine/useGameClock";
import { useArrival } from "../engine/useArrival";
import { useAutoRally, useGameSession } from "../engine/useGameSession";
import { useGameKeys } from "../engine/useGameKeys";
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

const build = (game: CricketState, at: { phase: CricketPhase; offerHighlight: boolean }) =>
  buildCricketView(content, ui, ROUTES, game, at);

/**
 * The cricket route: it holds the over, runs the meter's clock, judges a release by it and walks the phases
 * (ready, flight, called, verdict, end). The referee decides, the view builder words it, the page draws it.
 * One input is exactly one ball: the phase is read from a ref the moment a ball is bowled, so a key repeat, a
 * click and a key in the same frame, or a press during the flight cannot bowl a second.
 */
export function CricketScreen() {
  const session = useGameSession({ venue: "cricket", start: START, build });
  // `latest` is the run as timers and handlers that were made before the last render must read it.
  const { run, latest, commit, view, timers, flight, live, desktop, reduced, layout, say } =
    session;
  const root = useRef<HTMLElement>(null);
  const balls = { stage: useRef<HTMLSpanElement>(null), column: useRef<HTMLSpanElement>(null) };

  const clock = useGameClock(root, {
    cssVar: "--meter",
    value: (t) => pingPong(t, CRICKET_PERIOD_MS),
    running: run.phase === "ready" && !reduced,
  });

  /** A ball has been bowled and judged: the call, what it unlocked, the sound and the line; the over's end is saved at once (G8). */
  const land = (next: CricketState) => {
    const over = cricketOver(next);
    const after = build(next, { phase: "called", offerHighlight: false });
    const ball = next.balls.at(-1);
    const now = live.current;
    if (ball && ball.runs > 0) now.audio.play("bat");
    if (now.desktop) now.say(after.comm, { interrupt: true });
    if (!over) {
      commit({ game: next, phase: "called" });
      timers.after(CRICKET_BEATS.callMs, () => commit({ phase: "ready" }));
      return;
    }
    session.finish(next, cricketWinner(next)!, after.saved);
  };

  /** The ball from your hand to the bounce and on to the bat, along the tracer; then `done`. Nothing but transform and opacity moves. */
  const fly = (where: GameLayout, bounce: { x: number; y: number }, done: () => void) => {
    const ball = balls[where].current;
    flight.fly({
      ms: CRICKET_BEATS.flightMs,
      place: (progress) => {
        const at = ballAt(where, bounce, progress);
        if (ball) ball.style.transform = `translate(${at.x}px, ${at.y}px)`;
      },
      start: () => ball && (ball.style.opacity = "1"),
      end: () => ball && (ball.style.opacity = "0"),
      // GSAP did not load: the ball still lands, only without its flight.
      done,
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

  const again = () =>
    session.again(() => {
      clock.restart();
      if (desktop) say(ui.games.cricket.comm.start, { interrupt: true });
      if (reduced) playOver();
    });

  useGameKeys(
    { down: { " ": release, Enter: release } },
    { active: run.phase === "ready" && !reduced },
  );

  // The arrival line (stage only) and GSAP warmed while the visitor reads the board, so the first ball flies on time.
  useArrival({ line: ui.games.cricket.comm.start, spoken: desktop, reduced });

  // Reduced motion: the over plays itself on arrival. Leaving, or the setting changing, ends it (and any ball in the air).
  useAutoRally(session, { play: playOver });

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
