import { expect, test } from "@playwright/test";
import { expectMatchesArtboard } from "../support/visual";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

test("Landing stadium + scoreboard match the Main artboard", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Main is a 1440×900 board");
  await page.goto(story("scene-stadium--landing-fidelity"));
  await page.locator("#storybook-root > *").first().waitFor();
  // Let the floodlight flicker finish (last bank at 2.0s + 1.6s).
  await page.waitForTimeout(3800);
  const ratio = await expectMatchesArtboard(page, "Main", {
    maxDiffRatio: 0.02,
    maskRects: [
      { x: 20, y: 10, width: 300, height: 56 }, // HUD brand lockup (0D/Phase 3)
      { x: 1120, y: 10, width: 300, height: 56 }, // HUD controls (0D/Phase 3); the small floodlight banks between stay compared
      { x: 360, y: 540, width: 720, height: 170 }, // challenge line + CTAs (Phase 3)
      { x: 30, y: 815, width: 400, height: 60 }, // commentary (Phase 3)
      { x: 1080, y: 828, width: 340, height: 32 }, // keyboard hint (Phase 3)
      { x: 560, y: 368, width: 320, height: 52 }, // subtitle: reference shows collapsed boot tracking (carry-over, Phase 3)
    ],
  });
  expect(ratio).toBeLessThanOrEqual(0.02);
});
