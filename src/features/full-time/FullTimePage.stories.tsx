import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useLayoutEffect, type ReactNode } from "react";
import { expect, within } from "storybook/test";
import { withShell } from "@/shell/storyDecorators";
import { artboardView, doneView, pendingView } from "./fullTime.fixture";
import { FullTimePage } from "./FullTimePage";

const meta: Meta = {
  title: "Features/Full Time",
  parameters: { layout: "fullscreen" },
  decorators: [withShell],
};
export default meta;

/** Compared pixel-for-pixel with Easter-Egg at 1440×900 (its own words; the strike-through and COMM are masked). */
export const Artboard: StoryObj = {
  render: () => <FullTimePage view={artboardView} />,
};

/** The verdict when the visitor came nowhere near: GOOD TRY. */
export const DoneGoodTry: StoryObj = {
  render: () => <FullTimePage view={doneView("goodTry")} />,
};

/** The verdict in between: NICE EFFORT. */
export const Done: StoryObj = {
  render: () => <FullTimePage view={doneView("niceEffort")} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1, name: "NICE EFFORT." })).toBeVisible();
    await expect(canvas.getByRole("img", { name: "Final score: You 0, Yash 3" })).toBeVisible();
    await expect(canvas.getAllByRole("link", { name: "TEAM UP" }).length).toBeGreaterThan(0);
  },
};

/** The verdict when the visitor came close: SO CLOSE. */
export const DoneSoClose: StoryObj = {
  render: () => <FullTimePage view={doneView("soClose")} />,
};

/** Opened with nothing played: NOT YET., cricket is next. */
export const Pending0: StoryObj = {
  render: () => <FullTimePage view={pendingView(0)} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1, name: "NOT YET." })).toBeVisible();
    await expect(canvas.getByText("CRICKET GROUND")).toBeVisible();
  },
};

/** Opened with two venues played: the badminton hall is next. */
export const Pending2: StoryObj = {
  render: () => <FullTimePage view={pendingView(2)} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("BADMINTON HALL")).toBeVisible();
  },
};

/** The phone's Full Time (390×844), a verdict. */
export const DonePhone: StoryObj = {
  render: () => <FullTimePage view={doneView("niceEffort")} />,
};

/** The phone's Full Time (390×844), opened early. */
export const PendingPhone: StoryObj = {
  render: () => <FullTimePage view={pendingView(1)} />,
};

/** What a returning visitor's page carries until their record loads: the record parts are hidden (H5). */
function PendingFlags({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");
    root.setAttribute("data-record", "");
    return () => {
      root.classList.remove("js");
      root.removeAttribute("data-record");
    };
  }, []);
  return <>{children}</>;
}
const pendingFlags: Decorator = (Story) => (
  <PendingFlags>
    <Story />
  </PendingFlags>
);

export const Loading: StoryObj = {
  decorators: [pendingFlags],
  render: () => <FullTimePage view={pendingView(0)} ready={false} />,
  play: async ({ canvasElement }) => {
    const hidden = canvasElement.querySelectorAll("[data-record-pending]");
    await expect(hidden.length).toBeGreaterThan(0);
    for (const el of hidden) await expect(getComputedStyle(el).visibility).toBe("hidden");
  },
};
