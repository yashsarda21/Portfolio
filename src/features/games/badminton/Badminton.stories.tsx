import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ui } from "@/content";
import { withShell } from "@/shell/storyDecorators";
import {
  artboardBadmintonView,
  calledView,
  freshView,
  lostView,
  fullTimeView,
} from "./badminton.fixture";
import { BadmintonPage } from "./BadmintonPage";

const badminton = ui.games.badminton;

const meta: Meta = {
  title: "Features/Games/Badminton",
  parameters: { layout: "fullscreen" },
  decorators: [withShell],
};
export default meta;

/** The meter's fill at its start (8 %), as the board draws it. */
const powerAtStart: Decorator = (Story) => (
  <div style={{ "--power": 0.08 } as React.CSSProperties}>
    <Story />
  </div>
);

/** A fresh game on the stage (1440×900): the board's parts, the hold waiting, every group still to come, and SKIP. */
export const Desktop: StoryObj = {
  decorators: [powerAtStart],
  render: () => <BadmintonPage view={freshView} phase="ready" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { level: 1, name: ui.routes.badminton.heading }),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: badminton.hold })).toBeVisible();
    await expect(canvas.getByText("UP NEXT · RALLY 1")).toBeVisible();
    await expect(canvas.getByRole("link", { name: badminton.skip })).toBeVisible();
  },
};

/** Compared pixel for pixel with Badminton-Play at 1440×900 (the meter at 8 %, no commentary line in a story). */
export const ArtboardParity: StoryObj = {
  decorators: [powerAtStart],
  render: () => <BadmintonPage view={artboardBadmintonView} phase="ready" />,
};

/** Match point on the one-thumb column (390×844): the newest charge in the chip, the slim meter, the hold under the thumb. */
export const Phone: StoryObj = {
  decorators: [powerAtStart],
  render: () => <BadmintonPage view={artboardBadmintonView} phase="ready" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: badminton.hold })).toBeVisible();
    await expect(canvas.getByText(badminton.phoneHint)).toBeVisible();
    await expect(canvas.getByText("ATTRIBUTE CHARGED · RALLY 3")).toBeVisible();
  },
};

/** A call being made: HE READS IT. on rally 2. */
export const Called: StoryObj = {
  render: () => <BadmintonPage view={calledView} phase="called" />,
};

/** The end of a lost game: 21–19, the attributes and a rematch. */
export const Lost: StoryObj = {
  render: () => <BadmintonPage view={lostView()} phase="end" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: badminton.see })).toBeVisible();
    await expect(canvas.getByRole("button", { name: ui.hud.rematch })).toBeVisible();
  },
};

/** All three venues played: SEE FULL TIME leads, the rematch stays. */
export const FullTime: StoryObj = {
  render: () => <BadmintonPage view={fullTimeView} phase="end" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: ui.games.fullTime })).toBeVisible();
  },
};
