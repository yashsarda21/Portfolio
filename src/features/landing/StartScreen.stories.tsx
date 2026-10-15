import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useLayoutEffect, type ReactNode } from "react";
import { expect, fn, within } from "storybook/test";
import { artboardLandingView } from "./landing.fixture";
import { StartScreen } from "./StartScreen";

/** What the page's head script says on a first visit: scripts are running and there is no return-visit flag. */
function FirstVisitFlags({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");
    return () => root.classList.remove("js");
  }, []);
  return <>{children}</>;
}
const firstVisit: Decorator = (Story) => (
  <FirstVisitFlags>
    <Story />
  </FirstVisitFlags>
);

const onChoose = fn();
const meta: Meta<typeof StartScreen> = {
  title: "Features/Landing/StartScreen",
  component: StartScreen,
  parameters: { layout: "fullscreen" },
  decorators: [firstVisit],
  args: { view: artboardLandingView, open: true, onChoose },
};
export default meta;

/** The first-visit start screen: SOUND ON is focused and primary; IN SILENCE sits quietly under it. */
export const FirstVisit: StoryObj<typeof StartScreen> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("dialog", { name: "Start the show" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "KICK OFF · SOUND ON" })).toHaveFocus();
    await expect(canvas.getByRole("button", { name: "KICK OFF IN SILENCE" })).toBeVisible();
  },
};
