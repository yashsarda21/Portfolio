import { useEffect, useRef } from "react";
import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { useArenaTransition } from "@/shell/transition";
import { autoRallyTimes } from "../engine/beats";
import { perfectShare } from "../engine/form";
import { useArrival } from "../engine/useArrival";
import { useGameClock } from "../engine/useGameClock";
import { useAutoRally, useGameSession } from "../engine/useGameSession";
import { useGameKeys } from "../engine/useGameKeys";
import { NO_END_FLAGS, type EndFlags } from "../engine/useMatchResult";
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
  windowFor,
  type Side,
  type TennisState,
} from "./referee";
import { TennisPage } from "./TennisPage";
import { buildTennisView, LIVE_PHASES, type TennisPhase } from "./view";

interface Run extends EndFlags {
  game: TennisState;
  phase: TennisPhase;
  /** The side the last return was sent to (null: none, or the serve went by). */
  shot: Side | null;
}
const START: Run = { game: TENNIS_START, phase: "ready", ...NO_END_FLAGS, shot: null };

const build = (game: TennisState, at: { phase: TennisPhase } & EndFlags) =>
  buildTennisView(content, ui, ROUTES, game, at);

/**
 * The tennis route: it holds the game, runs the serve's clock, judges a pick by it and walks the phases (ready, tell,
 * toss, window, called, verdict, end). The referee decides, the view builder words it, the page draws it. One input is
 * exactly one return: the phase is read from a ref the moment a side is picked, so a key repeat, a click and a key in
 * the same frame, or a pick during the call cannot return a second. The hit is the game clock's time when the window
 * opens, and a pick is judged by the same clock the serve's line is drawn from. A hidden tab ends the serve in play
 * and serves again when it is visible: time spent away is never judged (G2).
 */
export function TennisScreen() {
  const session = useGameSession({ venue: "tennis", start: START, build });
  // `latest` is the run as timers and handlers that were made before the last render must read it.
  const { run, latest, commit, view, timers, flight, live, desktop, reduced, layout, say } =
    session;
  const root = useRef<HTMLElement>(null);
  const balls = {
    stage: useRef<SVGCircleElement>(null),
    column: useRef<SVGCircleElement>(null),
  };

  // The serve in play: when the window opened on the game clock, and how long it is (the layout it began in).
  const hitAt = useRef<number | null>(null);
  const serve = useRef({ windowMs: 0, layout });
  // The first serve waits for the page's wipe to be done (m-7): `busyRef` is the wipe now, `waitingForPage` a serve due.
  const { busy } = useArenaTransition();
  const busyRef = useRef(busy);
  const waitingForPage = useRef(false);
  // A serve is due but the tab is hidden: it is served when the tab is visible again (G2).
  const waiting = useRef(false);
  const clock = useGameClock(root, {
    cssVar: "--serve",
    value: (t) => serveDrawn(t, hitAt.current, serve.current.windowMs),
    running: LIVE_PHASES.includes(run.phase) && !reduced,
  });

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
    flight.fly({
      ms: TENNIS_BEATS.flightMs,
      place: (progress) => {
        const at = returnAt(side, progress);
        if (ball) ball.style.transform = `translate(${at.x}px, ${at.y}px)`;
        el?.style.setProperty(`--return-${side}`, String(progress));
      },
      // The browser is told to get ready for the move only while the ball is moving (spec section 7).
      start: () => ball && ((ball.style.opacity = "1"), (ball.style.willChange = "transform")),
      end: () => ball && ((ball.style.opacity = "0"), (ball.style.willChange = "")),
    });
  };

  /** A return has been judged: the call, what it unlocked, the sound and the line; the game's end is saved at once (G8). */
  const land = (next: TennisState, side: Side | null) => {
    const over = tennisOver(next);
    const after = build(next, { phase: "called", ...NO_END_FLAGS });
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
    session.finish(next, { score: after.saved, form: perfectShare(next.returns) }, { shot: side });
  };

  /** The window is over and nobody picked: Yash's serve was an ace. */
  const timeOut = () => judge(null);

  /**
   * G2: nothing is served, tossed or judged while the tab is hidden (timers still fire in a hidden tab). If it is, the
   * serve in play is dropped, the game waits at ready, and the visible tab serves again.
   */
  const holdIfHidden = () => {
    if (document.visibilityState !== "hidden") return false;
    timers.clear();
    hitAt.current = null;
    clearLines();
    const cur = latest.current;
    commit({ game: { ...cur.game, serve: null }, phase: "ready", shot: null });
    waiting.current = true;
    return true;
  };

  /** The window opens at Yash's hit: the clock's time now is the zero every pick is measured from. */
  const openWindow = () => {
    if (holdIfHidden()) return;
    hitAt.current = clock.elapsed();
    commit({ phase: "window" });
    timers.after(serve.current.windowMs, timeOut);
  };

  /** Serve: the open side is drawn and lit (the tell), then the toss, then the hit (G5). */
  function beginServe() {
    if (holdIfHidden()) return;
    waiting.current = false;
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
      if (holdIfHidden()) return;
      commit({ phase: "toss" });
      timers.after(next.serve!.tossMs, openWindow);
    });
  }

  /** The visitor's pick (a key or a tap): a gesture, so a game reached directly makes sound too. Then it is judged. */
  function pick(side: Side) {
    live.current.audio.unlock();
    judge(side);
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
    land(playReturn(cur.game, { side, atMs }, serve.current.layout), side);
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
        );
        land(game, side);
      });
    });
  };

  /** After a rematch the first serve comes a beat after the click. */
  const serveFirst = () => timers.after(TELL_MS, beginServe);

  /** On arrival the visitor has the board to read: the first serve comes once the wipe is done and `firstMs` has gone by (m-7). */
  const serveOnArrival = () => {
    if (busyRef.current) waitingForPage.current = true;
    else timers.after(TENNIS_BEATS.firstMs, beginServe);
  };
  useEffect(() => {
    busyRef.current = busy;
    if (busy || !waitingForPage.current) return;
    waitingForPage.current = false;
    timers.after(TENNIS_BEATS.firstMs, beginServe);
    // Its handlers are the latest by ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  const again = () =>
    session.again(() => {
      hitAt.current = null;
      clearLines();
      if (desktop) say(content.commentary.entrance[0]!, { interrupt: true });
      if (live.current.reduced) playRally();
      else serveFirst();
    });

  useGameKeys(
    { down: { ArrowLeft: () => pick("left"), ArrowRight: () => pick("right") } },
    { active: LIVE_PHASES.includes(run.phase) && !reduced },
  );

  // The arrival line (stage only) and GSAP warmed while the visitor reads the board, so the first return flies on time.
  useArrival({ line: content.commentary.entrance[0]!, spoken: desktop, reduced });

  // The game starts on arrival, and again when the setting changes. Leaving ends it (and any ball in the air).
  useAutoRally(session, {
    play: playRally,
    otherwise: serveOnArrival,
    reset: () => (waitingForPage.current = false),
  });

  // G2: a hidden tab drops the serve in play and the game serves again when it is visible; time away is never judged.
  useEffect(() => {
    if (reduced) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (LIVE_PHASES.includes(latest.current.phase)) holdIfHidden();
      } else if (waiting.current) {
        waiting.current = false;
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
      onPick={pick}
      onAgain={again}
      rootRef={root}
      ballRefs={balls}
    />
  );
}
