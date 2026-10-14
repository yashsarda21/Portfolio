import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { IconToast } from "./IconToast";
import { ResultBoard } from "./ResultBoard";

const meta: Meta = { title: "Broadcast/Result" };
export default meta;

/** Easter-Egg's achievement toast: a volt tile with the trophy, then the glass body. */
export const Toast: StoryObj = {
  render: () => (
    <div className="bg-void p-10">
      <IconToast icon="trophy" eyebrow="MATCHDAY COMPLETE" title="FULL TIME" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("MATCHDAY COMPLETE")).toBeVisible();
    await expect(canvas.getByText("FULL TIME")).toBeVisible();
  },
};

/** The artboard's flipped scoreboard: the visitor won (home), so YOU is the volt cell. */
export const BoardHomeWins: StoryObj = {
  render: () => (
    <div className="bg-void p-10">
      <ResultBoard
        label="Final score: You 1, Yash 0"
        home={{ name: "YOU", score: "1" }}
        away={{ name: "YASH", score: "0" }}
        winner="home"
      />
    </div>
  ),
};

/** Full Time: Yash won (away), so YASH is the volt cell and YOU is dimmed. One sentence for a screen reader. */
export const BoardAwayWins: StoryObj = {
  render: () => (
    <div className="bg-void p-10">
      <ResultBoard
        label="Final score: You 0, Yash 3"
        home={{ name: "YOU", score: "0" }}
        away={{ name: "YASH", score: "3" }}
        winner="away"
        glitch
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("img", { name: "Final score: You 0, Yash 3" })).toBeVisible();
  },
};
