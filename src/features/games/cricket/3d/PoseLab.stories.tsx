import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useMemo, useState } from "react";
import type { CricketAim } from "../referee";
import type { Delivery } from "./delivery";
import type { ShotKind } from "./director";
import { LINE_X, type CameraPose } from "./field";
import { CricketScene, loadCricketAssets, type CricketAssets } from "./scene";
import { LEAP_AT, ballShotlist, readyShotlist, walkBackShotlist } from "./sequence";
import type { WorldState } from "./world";

/** A ball that fits each shot (spec §4.3): a yorker for a dot or the flick, a full ball driven, a short one pulled, a full toss lofted. */
const BALLS: Record<
  ShotKind,
  { speedKmh: number; pitchZ: number | null; bearing: Record<CricketAim, number> }
> = {
  dugOut: { speedKmh: 143, pitchZ: 2, bearing: { off: 0, middle: 0, leg: 0 } },
  beaten: { speedKmh: 143, pitchZ: 2, bearing: { off: 0, middle: 0, leg: 0 } },
  drive: { speedKmh: 135, pitchZ: 3, bearing: { off: -47, middle: 10, leg: 47 } },
  flick: { speedKmh: 143, pitchZ: 2, bearing: { off: 52, middle: 52, leg: 52 } },
  pull: { speedKmh: 124, pitchZ: 8, bearing: { off: 70, middle: 70, leg: 70 } },
  loft: { speedKmh: 124, pitchZ: null, bearing: { off: -20, middle: 5, leg: 20 } },
  cut: { speedKmh: 124, pitchZ: 8, bearing: { off: -95, middle: -95, leg: -95 } },
};

/** Close views for judging a pose (the TV view is the shotlist's own camera). */
const VIEWS = {
  yash: { position: [-8.5, 1.5, 1.6], target: [0.35, 0.9, 1.3] },
  yashLeg: { position: [8.5, 1.5, 1.4], target: [0.35, 0.9, 1.3] },
  yashBehind: { position: [0.3, 1.8, -8.5], target: [0.35, 0.9, 1.3] },
  bowler: { position: [-9, 1.8, 19], target: [0.6, 1.2, 19.5] },
  keeper: { position: [-6, 1.4, -8], target: [-0.4, 0.7, -12.8] },
  keeperFront: { position: [-1.2, 1.3, -9], target: [-0.4, 0.5, -13] },
  slip: { position: [-6.5, 1.3, -11], target: [-2.4, 0.6, -13.5] },
  slipFront: { position: [-3.2, 1.3, -9.5], target: [-2.4, 0.55, -13.5] },
  cover: { position: [-6.5, 2.2, 6.5], target: [-14.5, 0.5, 14.5] },
} as const satisfies Record<string, CameraPose>;

interface LabArgs {
  shot: ShotKind;
  line: CricketAim;
  /** Seconds from the run-up's start; past the ball's end, the walk back for the next ball. */
  t: number;
  layout: "stage" | "column";
  crowdUp: boolean;
  /** Before the run-up: everyone waiting (the aim view). */
  ready: boolean;
  view: "tv" | keyof typeof VIEWS;
}

/** The 3D ground frozen at one moment of one ball, for tuning the camera and the poses (dev only). */
function PoseLab({ shot, line, t, layout, crowdUp, ready, view }: LabArgs) {
  const [assets, setAssets] = useState<CricketAssets | null>(null);
  useEffect(() => {
    let live = true;
    loadCricketAssets(() => {}).then((a) => live && setAssets(a));
    return () => {
      live = false;
    };
  }, []);
  const lists = useMemo(() => {
    const b = BALLS[shot];
    const delivery: Delivery = {
      speedKmh: b.speedKmh,
      pitchZ: b.pitchZ,
      x: LINE_X[line],
      seam: 0,
      line,
    };
    const ball = ballShotlist(0, {
      ball: 0,
      delivery,
      shot: { kind: shot, bearing: b.bearing[line] },
      pressAt: LEAP_AT,
    });
    return { ball, back: walkBackShotlist(ball, 1) };
  }, [shot, line]);
  const world = useMemo(() => {
    const after = t > lists.ball.end;
    const list = ready ? readyShotlist(0) : after ? lists.back : lists.ball;
    const state: WorldState = {
      shotlist: view === "tv" ? list : { ...list, camera: () => VIEWS[view] },
      elapsed: () => (after ? t - lists.ball.end : t),
      crowdUp,
    };
    return { current: state };
  }, [lists, t, crowdUp, ready, view]);
  const size = layout === "stage" ? { width: 1440, height: 900 } : { width: 390, height: 844 };
  return (
    <div className="relative bg-night" style={size} data-ready={assets ? "true" : "false"}>
      {assets ? <CricketScene key={layout} assets={assets} world={world} layout={layout} /> : null}
    </div>
  );
}

const meta: Meta<LabArgs> = {
  title: "Dev/Cricket Pose Lab",
  component: PoseLab,
  parameters: { layout: "fullscreen" },
  args: {
    shot: "drive",
    line: "middle",
    t: 0,
    layout: "stage",
    crowdUp: false,
    ready: false,
    view: "tv",
  },
  argTypes: {
    shot: {
      control: "select",
      options: ["dugOut", "beaten", "drive", "flick", "pull", "cut", "loft"],
    },
    line: { control: "inline-radio", options: ["off", "middle", "leg"] },
    t: { control: { type: "range", min: 0, max: 10, step: 0.02 } },
    layout: { control: "inline-radio", options: ["stage", "column"] },
    view: { control: "select", options: ["tv", ...Object.keys(VIEWS)] },
  },
};
export default meta;

export const Lab: StoryObj<LabArgs> = {};
