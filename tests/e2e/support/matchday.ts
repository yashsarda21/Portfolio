import type { Page } from "@playwright/test";
import { ROUTES } from "../../../src/shell/routes";

/** The record of a finished matchday: 3 venues played, a best form each, every page seen, Yash 3 to 0. */
export const FULL_MATCHDAY = {
  venuesPlayed: ["cricket", "tennis", "badminton"],
  lastScores: { cricket: "14* NOT OUT", tennis: "21–19", badminton: "21–19" },
  bestForm: { cricket: 1 / 3, tennis: 1 / 3, badminton: 0.25 },
  sectionsSeen: ["career", "highlights", "attributes", "trophies", "card", "teamUp", "scout"],
  yashWins: 3,
};

/** Writes a full matchday into the saved record (the persist shape, version 2) before the page's own scripts run. */
export async function seedFullMatchday(page: Page) {
  await page.addInitScript((state) => {
    localStorage.setItem("arena:v1", JSON.stringify({ state, version: 2 }));
  }, FULL_MATCHDAY);
}

/** Every page of the site, plus a path that is not one (it renders OUT OF BOUNDS). */
export const ALL_PATHS: { name: string; path: string }[] = [
  ...Object.entries(ROUTES).map(([name, path]) => ({ name, path })),
  { name: "unknown", path: "/arena/nope" },
];
