import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Judged } from "../../engine/pick";
import type { GameLayout } from "../../engine/types";
import { KINDS, type Dir, type Player, type Rally as Played, type RallyKind } from "./match";
import {
  scriptRally,
  setupRally,
  type Decided,
  type Decision,
  type RallyScript,
  type RallySetup,
  type Window,
} from "./rally";
import { BadmintonScene, loadBadmintonAssets, type BadmintonAssets } from "./scene";
import { rallyShotlist, readyShotlist, walkShotlist, type Shotlist } from "./sequence";
import type { WorldState } from "./world";

const PICKS = ["none", "perfect", "good", "late", "early", "wrong"] as const;
type Pick = (typeof PICKS)[number];
const SHOWS = ["rally", "ready", "walk", "game"] as const;

interface LabArgs {
  /** Yash's card shot for the rally: Backend smash, Frontend drop, Data dive, Craft placement, the final smash. */
  kind: RallyKind;
  /** Your first pick as judged (none: the script stops at your first swing is not shown, pick one). */
  pick1: Pick;
  /** Your second pick (none: the rally ends after the first). */
  pick2: Pick;
  server: Player;
  box: "right" | "left";
  /** You are on 20: a good last shot goes into the net. */
  on20: boolean;
  layout: GameLayout;
  /** What to play: a whole rally, the stand-by before one, the walk between rallies, or the GAME push-in. */
  show: (typeof SHOWS)[number];
  /** A paused time (s from the start of what is shown); empty means playing, looping. */
  t: number | "";
}

/** The same numbers every time: fixed placements. */
const luck = (() => {
  let k = 0;
  return () => [0.3, 0.8, 0.45, 0.2, 0.7, 0.55][k++ % 6]!;
})();

const judged = (p: Exclude<Pick, "none">): Judged =>
  p === "perfect" || p === "good" ? { q: p, call: p } : { q: "miss", call: p };

/** A pick as the screen makes it: early before Yash's hit, late as the window runs out, wrong at the other part. */
function decision(p: Exclude<Pick, "none">, w: Window): Decision {
  const span = w.commits - w.opens;
  const other: Dir = w.open === "deep" ? "short" : "deep";
  const pick: { dir: Dir | null; at: number } =
    p === "early"
      ? { dir: w.open, at: w.opens - 0.1 }
      : p === "late"
        ? { dir: null, at: w.commits }
        : p === "wrong"
          ? { dir: other, at: w.opens + span * 0.5 }
          : { dir: w.open, at: w.opens + span * (p === "perfect" ? 0.2 : 0.7) };
  return { j: judged(p), ...pick };
}

/** The state that makes `kind` Yash's card shot: one rally won by him for each kind before it. */
function stateFor(kind: RallyKind) {
  const win: Played = {
    server: "yash",
    kind: "smash",
    winner: "yash",
    call: "early",
    shots: 3,
    picks: [],
    card: null,
  };
  return { rallies: Array.from({ length: KINDS.indexOf(kind) }, () => win) };
}

/** What the lab plays for these args: the script (for the marks) and its shotlist. */
function stage(args: LabArgs, assets: BadmintonAssets): { script: RallyScript; list: Shotlist } {
  const base = setupRally(stateFor(args.kind), args.layout, luck);
  const setup: RallySetup = {
    ...base,
    server: args.server,
    box: args.box,
    first: false,
    on20: args.on20,
  };
  const decided: Decided = {};
  let script = scriptRally(setup, decided, assets.reach);
  if (args.pick1 !== "none") {
    decided.first = decision(args.pick1, script.windows[0]!);
    script = scriptRally(setup, { ...decided }, assets.reach);
    if (args.pick2 !== "none" && script.windows[1]) {
      decided.second = decision(args.pick2, script.windows[1]);
      script = scriptRally(setup, { ...decided }, assets.reach);
    }
  }
  const rally = rallyShotlist(script, assets.reach);
  const list =
    args.show === "ready"
      ? readyShotlist(setup)
      : args.show === "walk"
        ? walkShotlist(rally, {
            ...setup,
            server: args.server === "yash" ? "you" : "yash",
            box: args.box === "right" ? "left" : "right",
          })
        : args.show === "game"
          ? walkShotlist(rally, null)
          : rally;
  return { script, list };
}

/** The 3D hall playing one scripted rally in real time, looping (dev only); `t` freezes it at one moment. */
function RallyLab(args: LabArgs) {
  const [assets, setAssets] = useState<BadmintonAssets | null>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    let live = true;
    loadBadmintonAssets(() => {}).then((a) => live && setAssets(a));
    return () => {
      live = false;
    };
  }, []);
  const { kind, pick1, pick2, server, box, on20, layout, show, t } = args;
  const shown = useMemo(
    () =>
      assets ? stage({ kind, pick1, pick2, server, box, on20, layout, show, t }, assets) : null,
    [assets, kind, pick1, pick2, server, box, on20, layout, show, t],
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
        serveAt: script.serveAt,
        dive: script.dive,
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
        <BadmintonScene
          key={layout}
          assets={assets}
          world={world}
          layout={layout}
          onDrawn={() => {
            // The rally starts when the first frame is on the canvas, not while its shaders compile.
            started.current = performance.now();
            setDrawn(true);
          }}
        />
      ) : null}
    </div>
  );
}

const meta: Meta<LabArgs> = {
  title: "Dev/Badminton Rally",
  component: RallyLab,
  parameters: { layout: "fullscreen" },
  args: {
    kind: "smash",
    pick1: "good",
    pick2: "late",
    server: "yash",
    box: "right",
    on20: false,
    layout: "stage",
    show: "rally",
    t: "",
  },
  argTypes: {
    kind: { control: "select", options: KINDS },
    pick1: { control: "select", options: PICKS },
    pick2: { control: "select", options: PICKS },
    server: { control: "inline-radio", options: ["yash", "you"] },
    box: { control: "inline-radio", options: ["right", "left"] },
    on20: { control: "boolean" },
    layout: { control: "inline-radio", options: ["stage", "column"] },
    show: { control: "inline-radio", options: SHOWS },
    t: { control: "text" },
  },
};
export default meta;

export const Rally: StoryObj<LabArgs> = {};

// One story per losing case (Phase 9: you always reach the shuttle). Freeze one at your swing with `t` (see data-marks).
/** No press at the first pick: he is at the shuttle's place, the racket comes after it. */
export const LateFirst: StoryObj<LabArgs> = { args: { pick1: "late", pick2: "none" } };
/** Too early at the first pick: he swings before the shuttle comes. */
export const EarlyFirst: StoryObj<LabArgs> = { args: { pick1: "early", pick2: "none" } };
/** A good first pick, no press at the second: late at the scoop. */
export const LateSecond: StoryObj<LabArgs> = { args: { pick1: "good", pick2: "late" } };
/** A good first pick, too early at the second. */
export const EarlySecond: StoryObj<LabArgs> = { args: { pick1: "good", pick2: "early" } };
/** On 20 a good last shot goes into the net (it was drawn just OUT before Phase 9). */
export const NetOn20: StoryObj<LabArgs> = { args: { pick1: "good", pick2: "good", on20: true } };
