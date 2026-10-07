import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useLayoutEffect, type ReactNode } from "react";
import { expect, within } from "storybook/test";
import { withShell } from "@/shell/storyDecorators";
import { artboardLandingView } from "./landing.fixture";
import { LandingPage } from "./LandingPage";

const meta: Meta = {
  title: "Features/Landing",
  parameters: { layout: "fullscreen" },
  decorators: [withShell],
};
export default meta;

/** The artboard's own copy, played to its end (the story test runs with animations: "disabled"). */
export const Desktop: StoryObj = {
  render: () => <LandingPage view={artboardLandingView} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1, name: "YASH SARDA" })).toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: /ENTER THE ARENA/ })).toHaveAttribute(
      "href",
      "/intro",
    );
  },
};

/** Compared pixel-for-pixel with Main at 1440×900 (same masks as the route). */
export const ArtboardParity: StoryObj = {
  render: () => <LandingPage view={artboardLandingView} />,
};

/** The phone and tablet column (the artboard's own copy). Narrow the viewport below 1200px to see it; the story test compares it at 390×844. */
export const Phone: StoryObj = {
  render: () => <LandingPage view={artboardLandingView} />,
};

/** What a return visit sets before first paint: the same show at a quarter of the time (--pace .25). */
function ReturnVisitFlag({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-return-visit", "");
    return () => root.removeAttribute("data-return-visit");
  }, []);
  return <>{children}</>;
}
const returnVisit: Decorator = (Story) => (
  <ReturnVisitFlag>
    <Story />
  </ReturnVisitFlag>
);

export const ReturnVisit: StoryObj = {
  decorators: [returnVisit],
  render: () => <LandingPage view={artboardLandingView} />,
  play: async () => {
    await expect(getComputedStyle(document.documentElement).getPropertyValue("--pace").trim()).toBe(
      "0.25",
    );
  },
};
