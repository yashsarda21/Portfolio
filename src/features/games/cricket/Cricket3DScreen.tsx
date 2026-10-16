import { useEffect, useRef, useState } from "react";
import { ui } from "@/content";
import { useArrival } from "../engine/useArrival";
import { useGameClock } from "../engine/useGameClock";
import { useGameKeys } from "../engine/useGameKeys";
import { useGameSession } from "../engine/useGameSession";
import { NO_END_FLAGS, type EndFlags } from "../engine/useMatchResult";
import { ThreeBoundary } from "../three/ThreeBoundary";
import { THREE_SHOW_TIMEOUT_MS, type ThreeGate } from "../three/useThreeGate";
import type { CricketAssets, CricketScene } from "./3d/scene";
import { planDelivery } from "./3d/delivery";
import { pickShot } from "./3d/director";
import {
  ballShotlist,
  readyShotlist,
  RUNUP,
  RUNUP_END,
  sweepAt,
  walkBackShotlist,
  type Cue,
  type Shotlist,
} from "./3d/sequence";
import type { WorldState } from "./3d/world";
import { CricketPage } from "./CricketPage";
import {
  bowl as bowlBall,
  CRICKET_3D_BEATS,
  CRICKET_BALLS,
  CRICKET_START,
  LINES,
  lengthQuality,
  type CricketAim,
  type CricketState,
} from "./referee";
import { buildCricket, cricketCalls } from "./cricketCalls";
import { buildCricket3dControls, type CricketPhase } from "./view";

/** What the 3D download brings: the scene component and the files it draws. */
export interface Cricket3d {
  Scene: typeof CricketScene;
  assets: CricketAssets;
}

interface Run extends EndFlags {
  game: CricketState;
  phase: CricketPhase;
  aim: CricketAim;
  /** The last ball's speed on the gun; null before the first. */
  speedKmh: number | null;
}
const START: Run = {
  game: CRICKET_START,
  phase: "ready",
  aim: "middle",
  speedKmh: null,
  ...NO_END_FLAGS,
};

/**
 * Cricket in 3D (spec §3): pick a line, press BOWL and the bowler runs in; the meter sweeps once across the end of
 * his run-up and the next press releases the ball. The referee judges that place exactly as the 2D game does; the
 * scene is drawn from `world`, a shotlist and its clock, so nothing per frame goes through React.
 * One input is one ball: the phase is read from a ref the moment a press arrives (Review Focus 1).
 */
export function Cricket3DScreen({ gate }: { gate: ThreeGate<Cricket3d> }) {
  const session = useGameSession({ venue: "cricket", start: START, build: buildCricket });
  const { run, latest, commit, view, timers, live, desktop, layout, say } = session;
  // The files are in: the scene mounts, hidden, and compiles its shaders; the loader stays until then. Once shown, the
  // game takes input for the rest of the visit. `drawn` is this canvas's own: the board's backdrop stays over it until
  // its first frame is on it (a resize across 1200px mounts a new canvas, which draws again).
  const [shown, setShown] = useState(false);
  const ready = gate.status === "ready" && shown;
  const [drawn, setDrawn] = useState<{ layout: typeof layout; on: boolean }>({ layout, on: false });
  if (drawn.layout !== layout) setDrawn({ layout, on: false });
  // A line change is said too (the arrows change buttons that do not have the focus); the next call replaces it.
  const [lineSaid, setLineSaid] = useState<{ text: string; over: string } | null>(null);
  const root = useRef<HTMLElement>(null);
  // Where the meter stopped at the release: it holds there through the flight and the call.
  const meterAt = useRef(0);
  const clock = useGameClock(root, {
    cssVar: "--meter",
    value: (ms) =>
      latest.current.phase === "runup"
        ? sweepAt(ms)
        : latest.current.phase === "ready"
          ? 0
          : meterAt.current,
    running: ready,
  });
  const world = useRef<WorldState>(null);
  world.current ??= {
    shotlist: readyShotlist(0),
    elapsed: () => clock.elapsed() / 1000,
    crowdUp: false,
  };
  const { land } = cricketCalls(session);

  /** Puts a shotlist on the field; `restart` starts its clock at 0 (the ball goes on the run-up's clock). */
  const show = (shotlist: Shotlist, restart = true) => {
    world.current!.shotlist = shotlist;
    if (restart) clock.restart();
  };
  /** Each cue's sound at its time on the shotlist's clock, from `now` (s). Timers: leaving or a hidden tab silences them. */
  const cue = (cues: Cue[], now: number) =>
    cues.forEach((c) =>
      timers.after(Math.max(0, (c.at - now) * 1000), () => live.current.audio.play(c.sound)),
    );

  const startRunup = () => {
    const ball = latest.current.game.balls.length;
    meterAt.current = 0;
    world.current!.crowdUp = ball === CRICKET_BALLS - 1;
    commit({ phase: "runup", speedKmh: null });
    const runup = ballShotlist(ball, null);
    show(runup);
    cue(runup.cues, 0);
    timers.after(RUNUP_END * 1000, release); // no press by the end: released as a full toss
  };

  /** The press in the run-up: judged by the clock the meter is drawn from, then the ball, the shot and the call. */
  const release = () => {
    if (latest.current.phase !== "runup") return;
    const ms = clock.elapsed();
    if (ms < RUNUP.approach * 1000) return; // the meter has not started: the press is ignored
    timers.clear(); // the claps stop, the auto-release is cancelled
    const p = sweepAt(ms);
    meterAt.current = p;
    const { game, aim } = latest.current;
    const quality = lengthQuality(p, live.current.layout);
    const next = bowlBall(game, quality, { aim, full: p > 0.5 });
    const index = game.balls.length;
    const delivery = planDelivery({ quality, p, line: aim });
    const shot = pickShot(
      { call: next.balls.at(-1)!.call, q: quality, last: index === CRICKET_BALLS - 1 },
      delivery,
    );
    const ball = ballShotlist(index, { ball: index, delivery, shot, pressAt: ms / 1000 });
    show(ball, false); // the run-up and the ball share one clock
    commit({ phase: "flight", speedKmh: delivery.speedKmh });
    if (!live.current.desktop) navigator.vibrate?.(20);
    cue(ball.cues, ms / 1000);
    timers.after((ball.end - ms / 1000) * 1000, () => {
      land(next, { callMs: CRICKET_3D_BEATS.calledMs, sounds: false });
      show(walkBackShotlist(ball, Math.min(next.balls.length, CRICKET_BALLS - 1)));
    });
  };

  const press = () => {
    live.current.audio.unlock(); // a bowl is a gesture: a game reached directly makes sound too
    if (!ready) return;
    if (latest.current.phase === "ready") startRunup();
    else release();
  };
  const setLine = (aim: CricketAim) => {
    if (latest.current.phase !== "ready" || aim === latest.current.aim) return;
    commit({ aim });
    const controls = buildCricket3dControls(ui, { phase: "ready", aim, speedKmh: null });
    setLineSaid({ text: controls.lines.said, over: view.announce });
  };
  const step = (by: -1 | 1) => {
    const i = LINES.indexOf(latest.current.aim);
    setLine(LINES[Math.min(LINES.length - 1, Math.max(0, i + by))]!);
  };
  const pickLine = setLine;

  // Review Focus 2: a hidden tab cancels a ball in its run-up or flight, uncounted; it is bowled again fresh.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      const phase = latest.current.phase;
      if (phase !== "runup" && phase !== "flight") return;
      timers.clear();
      commit({ phase: "ready", speedKmh: null });
      show(readyShotlist(latest.current.game.balls.length));
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // Its handlers are the latest by ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The 3D game's own recordings; the stadium hums under it while it is on screen (from the first gesture, sound on).
  useEffect(() => live.current.audio.prefetchSounds(["ooh", "murmur"]), [live]);
  useEffect(() => {
    if (!ready) return;
    const audio = live.current.audio;
    audio.ambience(true);
    return () => audio.ambience(false);
  }, [ready, live]);

  // Review M3: after the files arrive, the scene gets THREE_SHOW_TIMEOUT_MS to compile and draw, or the 2D game takes over.
  useEffect(() => {
    if (gate.status !== "ready" || shown) return;
    const cap = setTimeout(gate.fail, THREE_SHOW_TIMEOUT_MS);
    return () => clearTimeout(cap);
  }, [gate.status, gate.fail, shown]);

  const again = () =>
    session.again(() => {
      world.current!.crowdUp = false;
      show(readyShotlist(0));
      if (desktop) say(ui.games.cricket.comm.start, { interrupt: true });
    });

  useGameKeys(
    {
      down: {
        " ": press,
        Enter: press,
        ArrowLeft: () => step(-1),
        ArrowRight: () => step(1),
      },
    },
    { active: ready && (run.phase === "ready" || run.phase === "runup") },
  );
  useArrival({
    line: ui.games.cricket.comm.start,
    spoken: desktop,
    reduced: false,
    warm: false,
  });

  const controls = buildCricket3dControls(ui, {
    phase: run.phase,
    aim: run.aim,
    speedKmh: run.speedKmh,
  });
  const loaded = gate.value;
  const scene =
    gate.status === "ready" && loaded ? (
      <ThreeBoundary onError={gate.fail}>
        <loaded.Scene
          assets={loaded.assets}
          world={world}
          layout={layout}
          onShown={() => setShown(true)}
          onDrawn={() => setDrawn({ layout, on: true })}
        />
      </ThreeBoundary>
    ) : null;
  return (
    <CricketPage
      view={view}
      phase={run.phase}
      onBowl={press}
      onAgain={again}
      rootRef={root}
      three={{
        status: ready ? "ready" : "loading",
        drawn: ready && drawn.on,
        progress: gate.progress,
        scene,
        layout,
        controls,
        onLine: pickLine,
        announce: lineSaid && lineSaid.over === view.announce ? lineSaid.text : undefined,
      }}
    />
  );
}
