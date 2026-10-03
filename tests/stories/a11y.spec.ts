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
  throw new Error("storybook-static/index.json not found — run `pnpm build-storybook` first.");
}
const entries = Object.values(
  (JSON.parse(readFileSync(INDEX, "utf8")) as { entries: Record<string, IndexEntry> }).entries,
).filter((e) => e.type === "story");

test("the story index is not empty", () => {
  expect(entries.length).toBeGreaterThan(0);
});

for (const story of entries) {
  test(`a11y: ${story.title} / ${story.name}`, async ({ page }) => {
    // a11y.manual: the addon's own auto-run would race our axe run ("Axe is already running").
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=a11y.manual:!true`);
    await page.locator("#storybook-root > *").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await expectNoA11yViolations(page);
  });
}
