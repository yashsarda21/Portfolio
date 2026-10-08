import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useLayoutEffect, type ReactNode } from "react";
import { expect, userEvent, within } from "storybook/test";
import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { withShell } from "@/shell/storyDecorators";
import { artboardHubView, artboardRecord } from "./hub.fixture";
import { HubPage } from "./HubPage";
import { buildHubView } from "./view";

const meta: Meta = {
  title: "Features/Hub",
  parameters: { layout: "fullscreen" },
  decorators: [withShell],
};
export default meta;

const fresh = buildHubView(content, ui, ROUTES, {
  venuesPlayed: [],
  lastScores: {},
  sectionsSeen: [],
  record: { yash: 0, you: 0 },
  achievements: [],
  lockerRoomUnlocked: false,
});
const unlocked = buildHubView(content, ui, ROUTES, {
  ...artboardRecord,
  venuesPlayed: ["cricket", "tennis", "badminton"],
  lastScores: { cricket: "14* NOT OUT", tennis: "WON 2-1", badminton: "WON 15-9" },
  sectionsSeen: ["career", "highlights", "attributes", "trophies", "card", "teamUp", "scout"],
  record: { yash: 2, you: 1 },
  achievements: ["giant-killer"],
  lockerRoomUnlocked: true,
});

/** The artboard's state: cricket played, record 1 to 0, Career seen. */
export const Desktop: StoryObj = {
  render: () => <HubPage view={artboardHubView} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { level: 1, name: ui.routes.arena.heading }),
    ).toBeVisible();
    await expect(canvas.getAllByRole("article")).toHaveLength(3);
    await expect(canvas.getByRole("navigation", { name: ui.hub.index.label })).toBeVisible();
  },
};

/** Compared pixel-for-pixel with Hub at 1440×900 (same masks as the route; the story has no commentary line). */
export const ArtboardParity: StoryObj = {
  render: () => <HubPage view={artboardHubView} />,
};

/** A first-time visitor: nothing played, record 0 to 0. */
export const Fresh: StoryObj = {
  render: () => <HubPage view={fresh} />,
};

/** After a win: all three played, the Locker Room listed, the achievement open. */
export const Unlocked: StoryObj = {
  render: () => <HubPage view={unlocked} />,
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

export const Pending: StoryObj = {
  decorators: [pendingFlags],
  render: () => <HubPage view={fresh} ready={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1 })).toBeVisible();
    const hidden = canvasElement.querySelectorAll("[data-record-pending]");
    await expect(hidden.length).toBeGreaterThan(0);
    for (const el of hidden) await expect(getComputedStyle(el).visibility).toBe("hidden");
  },
};

/** The phone's Hub (390×844) with the artboard's record, standing on /arena so the ARENA tab is current. */
export const Phone: StoryObj = {
  parameters: { route: ROUTES.arena },
  render: () => <HubPage view={artboardHubView} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("article")).toHaveLength(6);
    await expect(canvas.getByRole("link", { name: "ARENA" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};

/** A first-time visitor on a phone: nothing played, the duration where the score would be. */
export const PhoneFresh: StoryObj = {
  parameters: { route: ROUTES.arena },
  render: () => <HubPage view={fresh} />,
};

/** The index drawer open on a phone: the record chip, the matchday card, the full index, the achievements. */
export const PhoneDrawerOpen: StoryObj = {
  parameters: { route: ROUTES.arena },
  render: () => <HubPage view={artboardHubView} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: ui.hub.drawer.open }));
    await expect(canvas.getByRole("dialog", { name: ui.hub.index.label })).toBeVisible();
  },
};
