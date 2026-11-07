import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GameLayout } from "../../engine/types";
import type { TennisReturn } from "../referee";
import { MATCH_START, type Court } from "./match";
import { scriptPoint, setupPoint, type Decided, type Decision, type PointScript } from "./rally";
import { loadTennisAssets, TennisScene, type TennisAssets } from "./scene";
import { pointShotlist, readyShotlist, walkShotlist, type Shotlist } from "./sequence";
import type { WorldState } from "./world";

const SCENARIOS = ["ace", "early", "wrongReturn", "late", "intoNet", "winner", "netAt30"] as const;
type Scenario = (typeof SCENARIOS)[number];
const SHOWS = ["point", "ready", "walk", "game"] as const;

interface LabArgs {
  scenario: Scenario;
  layout: GameLayout;
  court: Court;
  /** What to play: a whole point, the stand-by before one, the walk between points, or the GAME push-in. */
  show: (typeof SHOWS)[number];
  /** A paused time (s from the start of what is shown); empty means playing, looping. */
  t: number | "";
}

const MISS = (call: TennisReturn["call"]): TennisReturn => ({ q: "miss", call });
const GOOD: TennisReturn = { q: "good", call: "returned" };
/** Your two inputs for each scenario (none: the script stops at the first). */
const INPUTS: Record<Scenario, TennisReturn[]> = {
  ace: [MISS("ace")],
  early: [MISS("early")],
  wrongReturn: [MISS("wrong")],
  late: [GOOD, MISS("ace")],
  intoNet: [GOOD, MISS("wrong")],
  winner: [GOOD, GOOD],
  netAt30: [GOOD, GOOD],
};

/** An input as the screen makes it: early during the toss, late as the window runs out, the rest at the open side. */
function decision(r: TennisReturn, w: PointScript["windows"][number]): Decision {
  const span = w.commits - w.opens;
  if (r.call === "early") return { r, side: w.open, at: w.opens - 0.1 };
  if (r.call === "ace") return { r, side: null, at: w.commits };
  if (r.call === "wrong")
    return { r, side: w.open === "left" ? "right" : "left", at: w.opens + span * 0.5 };
  return { r, side: w.open, at: w.opens + span * 0.7 };
}

/** The same numbers every time: the first point's windows, the open sides Yash's score implies, fixed placements. */
const luck = (() => {
  let k = 0;
  return () => [0.3, 0.8, 0.45, 0.2, 0.7, 0.55][k++ % 6]!;
})();

/** What the lab plays for these args: the script (for the marks) and its shotlist. */
function stage(args: LabArgs, assets: TennisAssets): { script: PointScript; list: Shotlist } {
  const base = setupPoint(MATCH_START, args.layout, luck);
  const setup = {
    ...base,
    court: args.court,
    capped: args.scenario === "netAt30",
    gamePoint: args.show === "game",
  };
  const decided: Decided = {};
  let script = scriptPoint(setup, decided, assets.reach);
  const inputs = INPUTS[args.scenario];
  if (inputs[0]) {
    decided.first = decision(inputs[0], script.windows[0]!);
    script = scriptPoint(setup, { ...decided }, assets.reach);
  }
  if (inputs[1]) {
    decided.second = decision(inputs[1], script.windows[1]!);
    script = scriptPoint(setup, { ...decided }, assets.reach);
  }
  const point = pointShotlist(script, assets.reach);
  const list =
    args.show === "ready"
      ? readyShotlist(setup, assets.reach)
      : args.show === "walk"
        ? walkShotlist(point, { ...setup, court: args.court === "deuce" ? "ad" : "deuce" })
        : args.show === "game"
          ? walkShotlist(point, null)
          : point;
  return { script, list };
}

/** The 3D court playing one scripted point in real time, looping (dev only); `t` freezes it at one moment. */
function PointLab(args: LabArgs) {
  const [assets, setAssets] = useState<TennisAssets | null>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    let live = true;
    loadTennisAssets(() => {}).then((a) => live && setAssets(a));
    return () => {
      live = false;
    };
  }, []);
  const { scenario, layout, court, show, t } = args;
  const shown = useMemo(
    () => (assets ? stage({ scenario, layout, court, show, t }, assets) : null),
    [assets, scenario, layout, court, show, t],
  );
  const started = useRef(0);
  const world = useRef<WorldState | null>(null);
  useEffect(() => {
    if (!shown) return;
    started.current = performance.now();
    const end = shown.list.end;
    world.current = {
      shotlist: shown.list,
      elapsed: () => {
        if (t !== "") return Number(t);
        // Plays to the end, rests a moment, and goes again.
        return ((performance.now() - started.current) / 1000) % (end + 1);
      },
      crowdUp: show === "game",
    };
    return () => {
      world.current = null;
    };
  }, [shown, show, t]);
  const size = layout === "stage" ? { width: 1440, height: 900 } : { width: 390, height: 844 };
  const { script } = shown ?? {};
  const marks = script
    ? JSON.stringify({
        end: shown!.list.end,
        serveClipAt: script.serveClipAt,
        tossAt: script.tossAt,
        serveAt: script.serveAt,
        contacts: script.swings.map((w) => [w.by, w.kind, w.contact, w.meets]),
        windows: script.windows,
        mark: script.mark?.from ?? null,
      })
    : "";
  return (
    <div
      className="relative bg-night"
      style={size}
      data-ready={drawn ? "true" : "false"}
      data-marks={marks}
    >
      {assets ? (
        <TennisScene
          key={layout}
          assets={assets}
          world={world}
          layout={layout}
          onDrawn={() => {
            // The point starts when the first frame is on the canvas, not while its shaders compile.
            started.current = performance.now();
            setDrawn(true);
          }}
        />
      ) : null}
    </div>
  );
}

const meta: Meta<LabArgs> = {
  title: "Dev/Tennis Point",
  component: PointLab,
  parameters: { layout: "fullscreen" },
  args: { scenario: "winner", layout: "stage", court: "deuce", show: "point", t: "" },
  argTypes: {
    scenario: { control: "select", options: SCENARIOS },
    layout: { control: "inline-radio", options: ["stage", "column"] },
    court: { control: "inline-radio", options: ["deuce", "ad"] },
    show: { control: "inline-radio", options: SHOWS },
    t: { control: "text" },
  },
};
export default meta;

export const Point: StoryObj<LabArgs> = {};

// One story per losing case (Phase 9: you always reach the ball). Freeze one at your swing with `t` (see data-marks).
/** No press: late at the first return; he lunges to the ball's line and is beaten by its pace. */
export const Ace: StoryObj<LabArgs> = { args: { scenario: "ace" } };
/** Too early: he is at the ball's place, swings before it comes. */
export const Early: StoryObj<LabArgs> = { args: { scenario: "early" } };
/** The wrong side: he hits it back to where Yash waits, and Yash puts it away. */
export const WrongSide: StoryObj<LabArgs> = { args: { scenario: "wrongReturn" } };
/** Too late on the rally ball (no press): he is there, the racket comes after the ball. */
export const LateRally: StoryObj<LabArgs> = { args: { scenario: "late" } };
/** The wrong side on the rally ball: the shot goes into the net. */
export const WrongRally: StoryObj<LabArgs> = { args: { scenario: "intoNet" } };
/** At 30 a good last shot goes into the net (it was drawn just OUT before Phase 9). */
export const NetAt30: StoryObj<LabArgs> = { args: { scenario: "netAt30" } };
