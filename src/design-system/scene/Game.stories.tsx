import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stage } from "../layout/Stage";
import { GameBackdrop } from "./GameBackdrop";
import { TrackingRing } from "./TrackingRing";
import { ShuttleMark, TracerPath } from "./TracerPath";

const meta: Meta = { title: "Scene/Game", parameters: { layout: "fullscreen" } };
export default meta;

const STAGE = "0 0 1440 900";
const COLUMN = "0 0 390 844";
const CRICKET_PATH = "M714 836 Q 716 560 719 352 Q 721 340 724 326";
const TENNIS_PATH = "M736 290 Q 700 420 640 640 Q 600 720 560 790";
const BADMINTON_PATH = "M560 770 Q 640 40 790 330";
const COLUMN_PATH = "M192 640 Q 194 420 195 236 Q 196 226 197 218";

/** Cricket-Play, 1440x900: the turf, Yash's static bat, both rings and the drawn ball path with its bounce. */
export const CricketStage: StoryObj = {
  render: () => (
    <Stage from={null} backdrop={<GameBackdrop venue="turf" frame="stage" />}>
      <TracerPath
        d={CRICKET_PATH}
        viewBox={STAGE}
        size="stage"
        className="opacity-85"
        bounce={{ cx: 719, cy: 353, rx: 12, ry: 4, tone: "floodlight" }}
      />
      <TrackingRing who="yash" size="stage" className="top-80.5 left-172.5" />
      <TrackingRing who="you" size="stage" className="top-207 left-169.5" />
    </Stage>
  ),
};

/** Tennis-Play, 1440x900: the court (the LED board is a broadcast part), the net, Yash's 56x14 ring and the serve's path. */
export const TennisStage: StoryObj = {
  render: () => (
    <Stage from={null} backdrop={<GameBackdrop venue="court" frame="stage" />}>
      <TracerPath
        d={TENNIS_PATH}
        viewBox={STAGE}
        size="stage"
        bounce={{ cx: 640, cy: 640, rx: 18, ry: 5, tone: "volt" }}
      />
      <TrackingRing who="yash" size="stage" className="top-83.5 left-185 h-3.5 w-14" />
    </Stage>
  ),
};

/** Badminton-Play, 1440x900: the hall under its lamp, both rings and the shuttle on its path. */
export const BadmintonStage: StoryObj = {
  render: () => (
    <Stage from={null} backdrop={<GameBackdrop venue="hall" frame="stage" />}>
      <TracerPath d={BADMINTON_PATH} viewBox={STAGE} size="stage">
        <ShuttleMark x={676} y={168} />
      </TracerPath>
      <TrackingRing who="yash" size="stage" className="top-83.5 left-190.5 h-3.5 w-14" />
      <TrackingRing who="you" size="stage" className="top-190.5 left-132.5 w-17.5" />
    </Stage>
  ),
};

/** Mobile-Game, 390x844: the turf with Yash's ring and the column's finer tracer. */
export const TurfColumn: StoryObj = {
  render: () => (
    <div className="relative h-211 w-97.5 overflow-hidden">
      <GameBackdrop venue="turf" frame="column" />
      <TracerPath d={COLUMN_PATH} viewBox={COLUMN} size="column" />
      <TrackingRing who="yash" size="column" className="top-53.5 left-43.5" />
    </div>
  ),
};

/** The court in the column (derived): the stage court cropped and scaled to the width, from 200px down. */
export const CourtColumn: StoryObj = {
  render: () => (
    <div className="relative h-211 w-97.5 overflow-hidden">
      <GameBackdrop venue="court" frame="column" />
    </div>
  ),
};

/** The hall in the column (derived). */
export const HallColumn: StoryObj = {
  render: () => (
    <div className="relative h-211 w-97.5 overflow-hidden">
      <GameBackdrop venue="hall" frame="column" />
    </div>
  ),
};

/** Both rings in each size, and the tracer part way drawn (draw 0.5). */
export const RingsAndTracers: StoryObj = {
  render: () => (
    <div className="relative h-100 w-180 bg-ground">
      <TrackingRing who="yash" size="stage" className="top-8 left-8" />
      <TrackingRing who="yash" size="stage" className="top-16 left-8 h-3.5 w-14" />
      <TrackingRing who="you" size="stage" className="top-24 left-8" />
      <TrackingRing who="you" size="stage" className="top-32 left-8 h-4.5 w-17.5" />
      <TrackingRing who="yash" size="column" className="top-40 left-8" />
      <TracerPath
        d="M200 360 Q 260 100 420 40"
        viewBox="0 0 720 400"
        size="stage"
        draw={0.5}
        bounce={{ cx: 300, cy: 200, rx: 18, ry: 5, tone: "volt" }}
      >
        <ShuttleMark x={420} y={60} />
      </TracerPath>
    </div>
  ),
};
