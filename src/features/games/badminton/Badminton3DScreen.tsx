import { useEffect, useRef } from "react";
import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { VERDICT_MS } from "../engine/beats";
import { perfectShare } from "../engine/form";
import { holdFor } from "../engine/spotlight";
import { useArrival } from "../engine/useArrival";
import { useGameClock } from "../engine/useGameClock";
import { useGameKeys } from "../engine/useGameKeys";
import { useGameSession } from "../engine/useGameSession";
import { NO_END_FLAGS, type EndFlags } from "../engine/useMatchResult";
import { stageCues, useFirstPlay, useHiddenTab } from "../three/useRallyLoop";
import type { ThreeGate } from "../three/useThreeGate";
import { useThreeScreen, type Loaded3d } from "../three/useThreeScreen";
import {
  allPicks,
  BADMINTON_3D_BEATS,
  judge,
  MATCH_START,
  matchOver,
  needsSecond,
  playRally,
  type Dir,
  type MatchState,
} from "./3d/match";
import {
  scriptRally,
  setupRally,
  type Decided,
  type RallyScript,
  type RallySetup,
} from "./3d/rally";
import type { BadmintonAssets } from "./3d/scene";
import { rallyShotlist, readyShotlist, walkShotlist, type Shotlist } from "./3d/sequence";
import { SERVE_CLIP, SWING_LEAD } from "./3d/timing";
import type { WorldState } from "./3d/world";
import { BadmintonPage } from "./BadmintonPage";
import { buildBadminton3dView, LIVE_3D, type Badminton3dPhase } from "./view";

/** What the 3D download brings: the scene component and the files it draws. */
export type Badminton3d = Loaded3d<BadmintonAssets, WorldState>;

interface Run extends EndFlags {
  game: MatchState;
  phase: Badminton3dPhase;
  /** The open part while a window is open. */
  open: Dir | null;
}
const START: Run = { game: MATCH_START, phase: "ready", open: null, ...NO_END_FLAGS };

const build = (game: MatchState, run: Run) => buildBadminton3dView(content, ui, ROUTES, game, run);

/** The rally in play: its setup (fixed for the rally), your picks so far, its script, and the score once it is decided. */
interface InPlay {
  setup: RallySetup;
  decided: Decided;
  script: RallyScript;
  next: MatchState | null;
}

/** The keys listen in these phases. A press in "struck" is swallowed (it must not scroll the page) and does nothing. */
const KEYS_ON: readonly Badminton3dPhase[] = [...LIVE_3D, "struck"];

/**
 * Badminton in 3D (spec §3): the last points of a real game, from 17–19 to 21. As each high shuttle comes to you, the
 * open part of Yash's court lights up and you pick deep (↑ SMASH) or short (↓ DROP); a good pick that beats him brings
 * his dive, his scoop and a second pick. Each rally is a script: drawn from its setup and the picks decided so far,
 * drawn again (on the same clock) the moment one is decided, and its timers staged again from then. The scene is
 * drawn from `world`, a shotlist and its clock, so nothing per frame goes through React. One pick per shot: the phase
 * is read from a ref the moment a pick arrives, and a pick moves it on (Review Focus 1).
 */
export function Badminton3DScreen({ gate }: { gate: ThreeGate<Badminton3d> }) {
  const session = useGameSession({ venue: "badminton", start: START, build });
  const { run, latest, commit, view, timers, live, desktop, layout, say } = session;
  const world = useRef<WorldState>(null);
  const { ready, drawn, scene } = useThreeScreen({
    gate,
    world,
    layout,
    audio: () => live.current.audio,
    hum: "hall",
  });
  const root = useRef<HTMLElement>(null);
  // The rally's clock: the shotlist on screen is drawn from it and every pick is judged by it. Nothing in the 3D
  // game reads the variable it writes.
  const clock = useGameClock(root, { cssVar: "--power", value: () => 0, running: ready });

  // The files, kept for the handlers (a handler made before they arrived reads them here).
  const files = useRef<BadmintonAssets>(null);
  const rally = useRef<InPlay>(null);
  // A rally is due but the tab is hidden: it is played when the tab is visible again (G2).
  const waiting = useRef(false);

  const reach = () => files.current!.reach;
  const elapsed = () => clock.elapsed() / 1000;
  /** A setup for `game`'s next rally, drawn now with the layout now. The players' places follow only from its boxes. */
  const places = (game: MatchState) => setupRally(game, live.current.layout, Math.random);

  // The files are in: both players wait at their places for the first rally.
  const assets = gate.value?.assets ?? null;
  useEffect(() => {
    if (!assets || files.current) return;
    files.current = assets;
    world.current = {
      shotlist: readyShotlist(places(MATCH_START)),
      elapsed,
      crowdUp: false,
    };
    // Its handlers are the latest by ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);

  /** Puts a shotlist on the court; `restart` starts its clock at 0 (a rebuild keeps the rally's clock). */
  const show = (shotlist: Shotlist, restart = true) => {
    world.current!.shotlist = shotlist;
    if (restart) clock.restart();
  };

  /**
   * G2: nothing is played while the tab is hidden (timers still fire there). If it is, the rally in play is dropped
   * (nothing of it counts or is saved), both wait at their places, and the visible tab begins the rally again.
   */
  function holdIfHidden() {
    if (document.visibilityState !== "hidden") return false;
    timers.clear();
    rally.current = null;
    show(readyShotlist(places(latest.current.game)));
    commit({ phase: "ready", open: null });
    waiting.current = true;
    return true;
  }

  /** A rally, from the server's routine, on a clock from 0. */
  function beginRally() {
    if (holdIfHidden()) return;
    waiting.current = false;
    // Drawn here, so a resize since the last rally gives this one the new layout's windows (§6.6).
    const setup = places(latest.current.game);
    const script = scriptRally(setup, {}, reach());
    rally.current = { setup, decided: {}, script, next: null };
    const list = rallyShotlist(script, reach());
    show(list);
    stage(script, list, 0);
    commit({ phase: "ready", open: null });
  }

  /**
   * The rally's timers from `now` (s on its clock), the old ones cleared first: each rebuild stages it again, and
   * nothing before `now` is touched. The serve's swing; each window still to come (it opens, and at its end no pick
   * is late); after a good first pick that brings a second, your contact; the sounds and the phone's buzz still
   * ahead; the call once the end is known.
   */
  function stage(script: RallyScript, list: Shotlist, now: number) {
    timers.clear();
    const at = (s: number, fn: () => void) => timers.after(Math.max(0, (s - now) * 1000), fn);
    const { first, second } = rally.current!.decided;
    if (!first) at(script.serveAt - SERVE_CLIP.contact, () => commit({ phase: "serve" }));
    script.windows.forEach((w, i) => {
      if (i === 0 ? first : second) return;
      at(w.opens, () => commit({ phase: "window", open: w.open }));
      at(w.commits, () => resolve(i === 0 ? 0 : 1, null, (elapsed() - w.opens) * 1000));
    });
    // Your good first shot is away: until his scoop opens the second window, a pick is TOO EARLY.
    const w1 = script.windows[0];
    if (first && !second && script.windows.length > 1 && w1)
      at(w1.commits + SWING_LEAD, () => commit({ phase: "rally" }));
    stageCues(list, now, at, live);
    if (script.end !== null) at(script.end, land);
  }

  /**
   * One pick (`i` 0: the first, 1: the second, after his scoop), judged with the windows the rally began with. The
   * rally is drawn again from it on the same clock, and staged again from now. A pick that brings no second, or the
   * second, decides it.
   */
  function resolve(i: 0 | 1, dir: Dir | null, atMs: number) {
    const p = rally.current;
    if (!p) return;
    const j = judge({ dir, atMs }, p.setup.open[i], p.setup.windows[i] * 1000);
    const now = elapsed();
    p.decided = { ...p.decided, [i === 0 ? "first" : "second"]: { j, dir, at: now } };
    p.script = scriptRally(p.setup, p.decided, reach());
    const list = rallyShotlist(p.script, reach());
    show(list, false);
    const { first, second } = p.decided;
    const game = latest.current.game;
    if (i === 1 || !needsSecond(game, first!.j))
      p.next = playRally(game, second ? [first!.j, second.j] : [first!.j]);
    // Your swing is under way: after a good first pick `stage` turns this into "rally" at your contact.
    commit({ phase: "struck", open: null });
    stage(p.script, list, now);
  }

  /**
   * Your pick (a key, a click, a tap or a swipe): a gesture, so a game reached directly makes sound too. In the serve,
   * a window or the rally shuttle it is judged by the rally's clock, as the scene shows it: before Yash's hit (or his
   * scoop) it is TOO EARLY (a negative time). Any other time it does nothing.
   */
  function pick(dir: Dir) {
    live.current.audio.unlock();
    const p = rally.current;
    if (!p) return;
    const i = p.decided.first ? 1 : 0;
    const phase = latest.current.phase;
    if (phase !== "serve" && phase !== "window" && phase !== "rally") return;
    const hit = p.script.windows[i];
    resolve(i, dir, hit ? (elapsed() - hit.opens) * 1000 : -1);
  }

  /** The rally's last shuttle is down: the call, the score and what it charged; the game's end is saved at once (G8). */
  function land() {
    const p = rally.current;
    if (!p?.next) return;
    const next = p.next;
    rally.current = null;
    const after = build(next, { ...START, game: next, phase: "called" });
    const now = live.current;
    commit({ game: next, phase: "called", open: null });
    if (now.desktop) now.say(after.comm, { interrupt: true });
    // Yash's unlock chimes as its spotlight appears; the spotlight holds SPOTLIGHT_MS, the visitor's words the call's time.
    if (after.spotlight?.kind === "unlock") now.audio.play("reveal");
    const hold = holdFor(after.spotlight, BADMINTON_3D_BEATS.callMs);
    const was = world.current!.shotlist;
    if (matchOver(next)) {
      session.finish(
        next,
        { score: after.saved, form: perfectShare(allPicks(next)) },
        {},
        { cheer: true, endMs: holdFor(after.spotlight, VERDICT_MS) },
      );
      // GAME: the crowd stands, Yash pumps his fist and the camera pushes in.
      world.current!.crowdUp = true;
      show(walkShotlist(was, null));
      return;
    }
    // The walk keeps its length; both then wait in their clips until the next rally.
    show(walkShotlist(was, places(next), hold / 1000));
    timers.after(hold, beginRally);
  }

  // On arrival the visitor has the hall to look at: the first rally comes `firstMs` after the scene is shown and the
  // page's wipe is done (m-7).
  useFirstPlay({ ready, firstMs: BADMINTON_3D_BEATS.firstMs, begin: beginRally, timers });

  // Review Focus 2: a hidden tab drops the rally in play; the visible tab plays it again, fresh from the routine.
  useHiddenTab({
    onHidden: () => {
      if (rally.current) holdIfHidden();
    },
    onVisible: () => {
      if (waiting.current) {
        waiting.current = false;
        if (latest.current.phase === "ready") beginRally();
      }
    },
  });

  // The 3D game's own recordings.
  useEffect(
    () => live.current.audio.prefetchSounds(["shuttle", "squeak", "applause", "ooh", "hall"]),
    [live],
  );

  const again = () =>
    session.again(() => {
      world.current!.crowdUp = false;
      rally.current = null;
      waiting.current = false;
      // No cut: the players walk from where GAME left them to the first rally's places, and the camera eases from the
      // push-in back to the TV view, as between any two rallies.
      show(walkShotlist(world.current!.shotlist, places(MATCH_START)));
      if (desktop) say(content.commentary.entrance[0]!, { interrupt: true });
      timers.after(BADMINTON_3D_BEATS.callMs, beginRally);
    });

  useGameKeys(
    { down: { ArrowUp: () => pick("deep"), ArrowDown: () => pick("short") } },
    { active: ready && KEYS_ON.includes(run.phase) },
  );
  useArrival({
    line: content.commentary.entrance[0]!,
    spoken: desktop,
    reduced: false,
    warm: false,
  });

  return (
    <BadmintonPage
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
        parts: view.three,
      }}
    />
  );
}
