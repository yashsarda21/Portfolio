import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ui } from "@/content";
import { withShell } from "@/shell/storyDecorators";
import {
  artboardCricketView,
  cricketView,
  lostView,
  phoneArtboardCricketView,
  playOver,
  wonView,
} from "./cricket.fixture";
import { CricketPage } from "./CricketPage";

const cricket = ui.games.cricket;

const meta: Meta = {
  title: "Features/Games/Cricket",
  parameters: { layout: "fullscreen" },
  decorators: [withShell],
};
export default meta;

/** The meter's cursor at the start of its sweep, as both boards draw it. */
const cursorAtStart: Decorator = (Story) => (
  <div style={{ "--meter": 0 } as React.CSSProperties}>
    <Story />
  </div>
);

/** A fresh over on the stage (1440×900): the board's parts, the BOWL button and SKIP. */
export const Desktop: StoryObj = {
  render: () => <CricketPage view={artboardCricketView} phase="ready" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { level: 1, name: ui.routes.cricket.heading }),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: cricket.bowl })).toBeVisible();
    await expect(canvas.getByRole("link", { name: cricket.skip })).toBeVisible();
  },
};

/** Compared pixel for pixel with Cricket-Play at 1440×900 (the cursor at 0, no commentary line in a story). */
export const ArtboardParity: StoryObj = {
  decorators: [cursorAtStart],
  render: () => <CricketPage view={artboardCricketView} phase="ready" />,
};

/** After ball 1, a SIX, on the one-thumb column (390×844). */
export const Phone: StoryObj = {
  render: () => <CricketPage view={phoneArtboardCricketView} phase="ready" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: cricket.bowlPhone })).toBeVisible();
    await expect(canvas.getByText("DEUTSCHE BANK")).toBeVisible();
  },
};

/** Compared with Mobile-Game at 390×844 (the cursor at 0). */
export const PhoneArtboardParity: StoryObj = {
  decorators: [cursorAtStart],
  render: () => <CricketPage view={phoneArtboardCricketView} phase="ready" />,
};

/** A call being made: FOUR on ball 2. */
export const Called: StoryObj = {
  render: () => (
    <CricketPage
      view={cricketView(playOver(["perfect", "good"]), { phase: "called" })}
      phase="called"
    />
  ),
};

/** The end of a lost over: the scorecard and play again. */
export const Lost: StoryObj = {
  render: () => <CricketPage view={lostView()} phase="end" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: cricket.see })).toBeVisible();
    await expect(canvas.getByRole("button", { name: cricket.again })).toBeVisible();
  },
};

/** After a second loss at this venue: the highlight leads, play again stays. */
export const Offer: StoryObj = {
  render: () => <CricketPage view={lostView(true)} phase="end" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: ui.games.highlight })).toBeVisible();
  },
};

/** The 1 %: dot, dot, wicket. Only the claim is offered. */
export const Won: StoryObj = {
  render: () => <CricketPage view={wonView} phase="end" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: cricket.claim })).toBeVisible();
  },
};
