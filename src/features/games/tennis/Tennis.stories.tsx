import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ui } from "@/content";
import { withShell } from "@/shell/storyDecorators";
import { artboardTennisView, calledView, freshView, lostView, wonView } from "./tennis.fixture";
import { TennisPage } from "./TennisPage";

const tennis = ui.games.tennis;

const meta: Meta = {
  title: "Features/Games/Tennis",
  parameters: { layout: "fullscreen" },
  decorators: [withShell],
};
export default meta;

/** A fresh game on the stage (1440×900): the board's parts, the zones waiting for the serve, and SKIP. */
export const Desktop: StoryObj = {
  render: () => <TennisPage view={freshView} phase="ready" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { level: 1, name: ui.routes.tennis.heading }),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: tennis.aim.to.left })).toBeVisible();
    await expect(canvas.getByRole("link", { name: tennis.skip })).toBeVisible();
  },
};

/** Compared pixel for pixel with Tennis-Play at 1440×900 (the marquee at its first frame, no commentary line in a story). */
export const ArtboardParity: StoryObj = {
  render: () => <TennisPage view={artboardTennisView} phase="tell" />,
};

/** Rally 3 in play on the one-thumb column (390×844): the open side lit on the court and under the thumb. */
export const Phone: StoryObj = {
  render: () => <TennisPage view={artboardTennisView} phase="tell" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const open = `${tennis.aim.to.right} ${tennis.aim.dash} ${tennis.aim.openName}`;
    await expect(canvas.getByRole("button", { name: open })).toBeVisible();
    await expect(canvas.getByRole("button", { name: tennis.aim.to.left })).toBeVisible();
    await expect(canvas.getByText(tennis.phoneHint)).toBeVisible();
  },
};

/** A call being made: CLEAN RETURN on rally 2, the ball sent to the right. */
export const Called: StoryObj = {
  render: () => <TennisPage view={calledView} phase="called" shot="right" />,
};

/** The end of a lost game: ON THE LINE, the highlights and a rematch. */
export const Lost: StoryObj = {
  render: () => <TennisPage view={lostView()} phase="end" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: tennis.see })).toBeVisible();
    await expect(canvas.getByRole("button", { name: ui.hud.rematch })).toBeVisible();
  },
};

/** The 1 %: three perfect returns and the winner. Only the claim is offered. */
export const Won: StoryObj = {
  render: () => <TennisPage view={wonView} phase="end" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: tennis.claim })).toBeVisible();
  },
};
