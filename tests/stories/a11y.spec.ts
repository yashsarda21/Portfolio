import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "../support/a11y";

interface IndexEntry {
  type: "story" | "docs";
  id: string;
  title: string;
  name: string;
}

const INDEX = join(process.cwd(), "storybook-static/index.json");
if (!existsSync(INDEX)) {
  throw new Error(
    "storybook-static/index.json not found — run `pnpm build-storybook` first. This gate tests whatever is in storybook-static; `pnpm verify` rebuilds it first.",
  );
}
const entries = Object.values(
  (JSON.parse(readFileSync(INDEX, "utf8")) as { entries: Record<string, IndexEntry> }).entries,
).filter((e) => e.type === "story");

test("the story index is not empty", () => {
  expect(entries.length).toBeGreaterThan(0);
});

// A story that plays a live GSAP show is mid-animation whenever axe looks (translucent text, parts still
// arriving), which it cannot judge. Its end state is a story of its own, and the route's e2e runs axe at done.
const PLAYS_LIVE = new Set(["features-intro--playing"]);

for (const story of entries.filter((e) => !PLAYS_LIVE.has(e.id))) {
  test(`a11y: ${story.title} / ${story.name}`, async ({ page }) => {
    // a11y.manual: the addon's own auto-run would race our axe run ("Axe is already running").
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=a11y.manual:!true`);
    // "attached", not visible: desktop-only stories (Stage) are display:none on the mobile project.
    await page.locator("#storybook-root > *").first().waitFor({ state: "attached" });
    await page.evaluate(() => document.fonts.ready);
    await expectNoA11yViolations(page);
  });
}
