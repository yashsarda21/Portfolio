import { useEffect, useRef } from "react";
import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { autoRallyTimes } from "../engine/beats";
import { perfectShare } from "../engine/form";
import { useArrival } from "../engine/useArrival";
import { useGameClock } from "../engine/useGameClock";
import { useAutoRally, useGameSession } from "../engine/useGameSession";
import { useGameKeys } from "../engine/useGameKeys";
import { NO_END_FLAGS, type EndFlags } from "../engine/useMatchResult";
import { BadmintonPage } from "./BadmintonPage";
import { shuttleTransform } from "./flight";
import {
  badmintonOver,
  BADMINTON_AUTO,
  BADMINTON_BEATS,
  BADMINTON_START_STATE,
  playRally,
  powerAt,
  type BadmintonState,
} from "./referee";
import { buildBadmintonView, type BadmintonPhase } from "./view";

interface Run extends EndFlags {
  game: BadmintonState;
  phase: BadmintonPhase;
}
const START: Run = { game: BADMINTON_START_STATE, phase: "ready", ...NO_END_FLAGS };

const build = (game: BadmintonState, at: { phase: BadmintonPhase } & EndFlags) =>
  buildBadmintonView(content, ui, ROUTES, game, at);

/** The phases in which a hold can begin or end: the game is waiting for you. */
const HOLDING: readonly BadmintonPhase[] = ["ready", "charging"];

/** The meter's rest: where it stands before a hold and after a rally, as the board draws it. */
const REST = powerAt(0) / 100;

/**
 * The badminton route: it holds the game, runs the meter's clock, judges a release by it and walks the phases (ready,
 * charging, flight, called, verdict, end). The referee decides, the view builder words it, the page draws it. One
 * hold is exactly one rally: the phase is read from a ref the moment a hold starts or ends, so a key repeat, a click
 * and a key in the same frame, or a press during the flight cannot play a second. The power is the game clock's time
 * at the release, the clock the meter's fill is drawn from. A hold can never get stuck: the window losing the focus,
 * a hidden tab and a key coming up anywhere let go at the power the meter has reached.
 */
export function BadmintonScreen() {
  const session = useGameSession({ venue: "badminton", start: START, build });
  // `latest` is the run as timers and handlers that were made before the last render must read it.
  const { run, latest, commit, view, timers, flight, live, desktop, reduced, say } = session;
  const root = useRef<HTMLElement>(null);
  const shuttles = {
    stage: useRef<SVGGElement>(null),
    column: useRef<SVGGElement>(null),
  };

  const clock = useGameClock(root, {
    cssVar: "--power",
    value: (t) => powerAt(t) / 100,
    running: run.phase === "charging" && !reduced,
  });

  /** The meter at rest, and the shuttle back where the board parks it. */
  const rest = () => {
    root.current?.style.setProperty("--power", String(REST));
    for (const shuttle of Object.values(shuttles)) {
      if (shuttle.current) shuttle.current.style.transform = "";
    }
  };

  /** Ready for the next hold. */
  const ready = () => {
    rest();
    commit({ phase: "ready" });
  };

  /** A rally has been played: the call, what it charged, the line; the game's end is saved at once (G8). */
  const land = (next: BadmintonState) => {
    const over = badmintonOver(next);
    const after = build(next, { phase: "called", ...NO_END_FLAGS });
    const now = live.current;
    if (now.desktop) now.say(after.comm, { interrupt: true });
    if (!over) {
      commit({ game: next, phase: "called" });
      timers.after(BADMINTON_BEATS.callMs, ready);
      return;
    }
    session.finish(next, { score: after.saved, form: perfectShare(next.rallies) });
  };

  /** The shuttle from your ring over the net to Yash's, along the arc. Nothing but transform moves. */
  const fly = (done: () => void) => {
    const shuttle = shuttles[live.current.layout].current;
    flight.fly({
      ms: BADMINTON_BEATS.flightMs,
      place: (progress) => {
        if (shuttle) shuttle.style.transform = shuttleTransform(progress);
      },
      // The browser is told to get ready for the move only while the shuttle is moving (spec section 7).
      start: () => shuttle && (shuttle.style.willChange = "transform"),
      end: () => shuttle && (shuttle.style.willChange = ""),
      // GSAP did not load: the rally still lands, only without its flight.
      done,
    });
  };

  /** The hold begins: the meter's clock starts from nothing. */
  const charge = () => {
    if (latest.current.phase !== "ready" || reduced) return;
    clock.restart();
    commit({ phase: "charging" });
  };

  /** One input: judge the release by the clock the meter was drawn from, then fly the shuttle (G2, G6). */
  const release = () => {
    if (latest.current.phase !== "charging") return;
    const power = powerAt(clock.elapsed());
    const next = playRally(latest.current.game, power);
    commit({ phase: "flight" });
    if (!live.current.desktop) navigator.vibrate?.(20);
    if (next.rallies.at(-1)?.shot === "smash") live.current.audio.play("smash");
    fly(() => land(next));
  };

  /** G10: with reduced motion the game plays itself, no movement: its rallies land at their beats, then the verdict. */
  const playGame = () => {
    let game = BADMINTON_START_STATE;
    autoRallyTimes(BADMINTON_AUTO.length).forEach((at, i) => {
      timers.after(at, () => {
        game = playRally(game, BADMINTON_AUTO[i]!);
        land(game);
      });
    });
  };

  const again = () =>
    session.again(() => {
      rest();
      clock.restart();
      if (desktop) say(ui.games.badminton.comm.start, { interrupt: true });
      if (reduced) playGame();
    });

  useGameKeys(
    { down: { " ": charge }, up: { " ": release } },
    { active: HOLDING.includes(run.phase) && !reduced },
  );

  // The arrival line (stage only) and GSAP warmed while the visitor reads the board, so the first rally flies on time.
  useArrival({ line: ui.games.badminton.comm.start, spoken: desktop, reduced });

  // The meter stands at rest on arrival, as the board draws it.
  useEffect(() => {
    rest();
    // `rest` touches refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While a hold is on, anything that takes the keyboard or the page away lets go at the power reached: the window
  // losing the focus, a hidden tab, or the key coming up on a control (which the game keys leave alone).
  useEffect(() => {
    if (run.phase !== "charging") return;
    const letGo = () => release();
    const onKeyUp = (e: KeyboardEvent) => e.key === " " && letGo();
    const onVisibility = () => document.visibilityState === "hidden" && letGo();
    window.addEventListener("blur", letGo);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", letGo);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // `release` reads the game by ref, and is the same from one render to the next in what it does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.phase]);

  // Reduced motion: the game plays itself on arrival. Leaving, or the setting changing, ends it (and any shuttle in the air).
  useAutoRally(session, { play: playGame, reset: rest });

  return (
    <BadmintonPage
      view={view}
      phase={run.phase}
      reduced={reduced}
      onCharge={charge}
      onRelease={release}
      onAgain={again}
      rootRef={root}
      shuttleRefs={shuttles}
    />
  );
}
