import { useEffect, useRef } from "react";
import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { useArenaTransition } from "@/shell/transition";
import { perfectShare } from "../engine/form";
import { useArrival } from "../engine/useArrival";
import { useGameClock } from "../engine/useGameClock";
import { useGameKeys } from "../engine/useGameKeys";
import { useGameSession } from "../engine/useGameSession";
import { NO_END_FLAGS, type EndFlags } from "../engine/useMatchResult";
import type { ThreeGate } from "../three/useThreeGate";
import { useThreeScreen, type Loaded3d } from "../three/useThreeScreen";
import {
  allInputs,
  judge,
  MATCH_START,
  matchOver,
  playPoint,
  TENNIS_3D_BEATS,
  type MatchState,
} from "./3d/match";
import {
  scriptPoint,
  setupPoint,
  type Decided,
  type PointScript,
  type PointSetup,
} from "./3d/rally";
import type { TennisAssets } from "./3d/scene";
import { pointShotlist, readyShotlist, walkShotlist, type Shotlist } from "./3d/sequence";
import type { WorldState } from "./3d/world";
import type { Side } from "./referee";
import { TennisPage } from "./TennisPage";
import { buildTennis3dView, LIVE_3D, type Tennis3dPhase } from "./view";

/** What the 3D download brings: the scene component and the files it draws. */
export type Tennis3d = Loaded3d<TennisAssets, WorldState>;

interface Run extends EndFlags {
  game: MatchState;
  phase: Tennis3dPhase;
  /** The open side while a window is open. */
  open: Side | null;
}
const START: Run = { game: MATCH_START, phase: "ready", open: null, ...NO_END_FLAGS };

const build = (game: MatchState, run: Run) => buildTennis3dView(content, ui, ROUTES, game, run);

/** The point in play: its setup (fixed for the point), your inputs so far, its script, and the score once it is decided. */
interface InPlay {
  setup: PointSetup;
  decided: Decided;
  script: PointScript;
  next: MatchState | null;
}

/** The keys listen in these phases. A press in "struck" is swallowed (it must not scroll the page) and does nothing. */
const KEYS_ON: readonly Tennis3dPhase[] = [...LIVE_3D, "struck"];

/**
 * Tennis in 3D (spec §3): Yash serves real points to 40. As he hits, the open side lights up and you pick a side; a
 * good return brings his rally shot and a second pick. Each point is a script: drawn from its setup and the inputs
 * decided so far, drawn again (on the same clock) the moment one is decided, and its timers staged again from then.
 * The scene is drawn from `world`, a shotlist and its clock, so nothing per frame goes through React.
 * One input per shot: the phase is read from a ref the moment a pick arrives, and a pick moves it on (Review Focus 1).
 */
export function Tennis3DScreen({ gate }: { gate: ThreeGate<Tennis3d> }) {
  const session = useGameSession({ venue: "tennis", start: START, build });
  const { run, latest, commit, view, timers, live, desktop, layout, say } = session;
  const world = useRef<WorldState>(null);
  const { ready, drawn, scene } = useThreeScreen({
    gate,
    world,
    layout,
    audio: () => live.current.audio,
    hum: "hush",
  });
  const root = useRef<HTMLElement>(null);
  // The point's clock: the shotlist on screen is drawn from it and every pick is judged by it. Nothing in the 3D
  // game reads the variable it writes.
  const clock = useGameClock(root, { cssVar: "--serve", value: () => 0, running: ready });

  // The files, kept for the handlers (a handler made before they arrived reads them here).
  const files = useRef<TennisAssets>(null);
  const point = useRef<InPlay>(null);
  // The first point waits for the page's wipe to be done (m-7): `busyRef` is the wipe now, `waitingForPage` a point due.
  const { busy } = useArenaTransition();
  const busyRef = useRef(busy);
  const waitingForPage = useRef(false);
  // A point is due but the tab is hidden: it is played when the tab is visible again (G2).
  const waiting = useRef(false);

  const reach = () => files.current!.reach;
  const elapsed = () => clock.elapsed() / 1000;
  /** A setup for `game`'s next point, drawn now with the layout now. The players' places follow only from its court. */
  const places = (game: MatchState) => setupPoint(game, live.current.layout, Math.random);

  // The files are in: both players wait at their places for the first point.
  const assets = gate.value?.assets ?? null;
  useEffect(() => {
    if (!assets || files.current) return;
    files.current = assets;
    world.current = {
      shotlist: readyShotlist(places(MATCH_START), assets.reach),
      elapsed,
      crowdUp: false,
    };
    // Its handlers are the latest by ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);

  /** Puts a shotlist on the court; `restart` starts its clock at 0 (a rebuild keeps the point's clock). */
  const show = (shotlist: Shotlist, restart = true) => {
    world.current!.shotlist = shotlist;
    if (restart) clock.restart();
  };

  /**
   * G2: nothing is played while the tab is hidden (timers still fire there). If it is, the point in play is dropped
   * (nothing of it counts or is saved), both wait at their places, and the visible tab begins the point again.
   */
  function holdIfHidden() {
    if (document.visibilityState !== "hidden") return false;
    timers.clear();
    point.current = null;
    show(readyShotlist(places(latest.current.game), reach()));
    commit({ phase: "ready", open: null });
    waiting.current = true;
    return true;
  }

  /** A point, from the first bounce of Yash's routine, on a clock from 0. */
  function beginPoint() {
    if (holdIfHidden()) return;
    waiting.current = false;
    // Drawn here, so a resize since the last point gives this one the new layout's windows (§6.6).
    const setup = places(latest.current.game);
    const script = scriptPoint(setup, {}, reach());
    point.current = { setup, decided: {}, script, next: null };
    const list = pointShotlist(script, reach());
    show(list);
    stage(script, list, 0);
    commit({ phase: "ready", open: null });
  }

  /**
   * The point's timers from `now` (s on its clock), the old ones cleared first: each rebuild stages it again, and
   * nothing before `now` is touched. The toss; each window still to come (it opens, and at its end no pick is late);
   * the rally ball after a good return; the sounds and the phone's buzz still ahead; the call once the end is known.
   */
  function stage(script: PointScript, list: Shotlist, now: number) {
    timers.clear();
    const at = (s: number, fn: () => void) => timers.after(Math.max(0, (s - now) * 1000), fn);
    const { first, second } = point.current!.decided;
    if (!first) at(script.tossAt, () => commit({ phase: "toss" }));
    script.windows.forEach((w, i) => {
      if (i === 0 ? first : second) return;
      at(w.opens, () => commit({ phase: "window", open: w.open }));
      at(w.commits, () => resolve(i === 0 ? 0 : 1, null, (elapsed() - w.opens) * 1000));
    });
    if (first && first.r.q !== "miss" && !second)
      at(script.contacts[0]!, () => commit({ phase: "rally" }));
    for (const c of list.cues) if (c.at >= now) at(c.at, () => live.current.audio.play(c.sound));
    const buzz = () => {
      if (!live.current.desktop) navigator.vibrate?.(15);
    };
    for (const b of list.buzz) if (b >= now) at(b, buzz);
    if (script.end !== null) at(script.end, land);
  }

  /**
   * One input (`i` 0: the return of serve, 1: your rally shot), judged with the windows the point began with. The
   * point is drawn again from it on the same clock, and staged again from now. A miss, or your second shot, decides it.
   */
  function resolve(i: 0 | 1, side: Side | null, atMs: number) {
    const p = point.current;
    if (!p) return;
    const r = judge(
      { side, atMs },
      p.setup.open[i],
      p.setup.windows[i === 0 ? "serve" : "rally"] * 1000,
    );
    const now = elapsed();
    p.decided = { ...p.decided, [i === 0 ? "first" : "second"]: { r, side, at: now } };
    p.script = scriptPoint(p.setup, p.decided, reach());
    const list = pointShotlist(p.script, reach());
    show(list, false);
    if (r.q === "miss" || i === 1) {
      const { first, second } = p.decided;
      p.next = playPoint(latest.current.game, second ? [first!.r, second.r] : [first!.r]);
    }
    // Your swing is under way: on a good return `stage` turns this into "rally" at your contact.
    commit({ phase: "struck", open: null });
    stage(p.script, list, now);
  }

  /**
   * Your pick (a key, a click, a tap or a swipe): a gesture, so a game reached directly makes sound too. In the toss,
   * a window or the rally ball it is judged by the point's clock, as the scene shows it: before Yash's hit it is TOO
   * EARLY (a negative time). Any other time it does nothing.
   */
  function pick(side: Side) {
    live.current.audio.unlock();
    const p = point.current;
    if (!p) return;
    const i = p.decided.first ? 1 : 0;
    const phase = latest.current.phase;
    if (phase !== "toss" && phase !== "window" && phase !== "rally") return;
    const hit = p.script.windows[i];
    resolve(i, side, hit ? (elapsed() - hit.opens) * 1000 : -1);
  }

  /** The point's last ball is done: the call, the score and what it unlocked; the game's end is saved at once (G8). */
  function land() {
    const p = point.current;
    if (!p?.next) return;
    const next = p.next;
    point.current = null;
    const after = build(next, { ...START, game: next, phase: "called" });
    const now = live.current;
    commit({ game: next, phase: "called", open: null });
    if (now.desktop) now.say(after.comm, { interrupt: true });
    const was = world.current!.shotlist;
    if (matchOver(next)) {
      session.finish(
        next,
        { score: after.saved, form: perfectShare(allInputs(next)) },
        {},
        {
          cheer: true,
        },
      );
      // GAME: the crowd stands, Yash pumps his fist and the camera pushes in.
      world.current!.crowdUp = true;
      show(walkShotlist(was, null));
      return;
    }
    show(walkShotlist(was, places(next)));
    timers.after(TENNIS_3D_BEATS.callMs, beginPoint);
  }

  // On arrival the visitor has the court to look at: the first point comes `firstMs` after the scene is shown and
  // the page's wipe is done (m-7).
  const serveOnArrival = () => {
    if (busyRef.current) waitingForPage.current = true;
    else timers.after(TENNIS_3D_BEATS.firstMs, beginPoint);
  };
  useEffect(() => {
    busyRef.current = busy;
    if (busy || !waitingForPage.current) return;
    waitingForPage.current = false;
    timers.after(TENNIS_3D_BEATS.firstMs, beginPoint);
    // Its handlers are the latest by ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);
  useEffect(() => {
    if (!ready) return;
    serveOnArrival();
    return () => {
      timers.clear();
      waitingForPage.current = false;
    };
    // Its handlers are the latest by ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Review Focus 2: a hidden tab drops the point in play; the visible tab plays it again, fresh from the routine.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (point.current) holdIfHidden();
      } else if (waiting.current) {
        waiting.current = false;
        if (latest.current.phase === "ready") beginPoint();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // Its handlers are the latest by ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The 3D game's own recordings.
  useEffect(
    () => live.current.audio.prefetchSounds(["hit", "court", "applause", "ooh", "hush"]),
    [live],
  );

  const again = () =>
    session.again(() => {
      world.current!.crowdUp = false;
      point.current = null;
      waiting.current = false;
      // No cut: the players walk from where GAME left them to the first point's places, and the camera eases from the
      // push-in back to the TV view, as between any two points.
      show(walkShotlist(world.current!.shotlist, places(MATCH_START)));
      if (desktop) say(content.commentary.entrance[0]!, { interrupt: true });
      timers.after(TENNIS_3D_BEATS.callMs, beginPoint);
    });

  useGameKeys(
    { down: { ArrowLeft: () => pick("left"), ArrowRight: () => pick("right") } },
    { active: ready && KEYS_ON.includes(run.phase) },
  );
  useArrival({
    line: content.commentary.entrance[0]!,
    spoken: desktop,
    reduced: false,
    warm: false,
  });

  return (
    <TennisPage
      view={view}
      phase={run.phase}
      onPick={pick}
      onAgain={again}
      rootRef={root}
      three={{
        status: ready ? "ready" : "loading",
        drawn,
        progress: gate.progress,
        scene,
        layout,
        live: LIVE_3D.includes(run.phase),
        loading: ui.games.tennis.three.loading,
      }}
    />
  );
}
