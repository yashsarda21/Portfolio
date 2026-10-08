import { expect, test } from "@playwright/test";
import { INTRO_D5_MASKS } from "../support/introLights";
import { expectMatchesArtboard } from "../support/visual";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

test("Intro end state matches the Intro artboard (artboard copy)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Intro is a 1440x900 board");
  await page.goto(story("features-intro--artboard-parity"));
  await page.locator('#storybook-root main[data-hold="done"]').waitFor();
  const ratio = await expectMatchesArtboard(page, "Intro", {
    maxDiffRatio: 0.02,
    maskRects: [
      { x: 30, y: 815, width: 400, height: 60 }, // the commentary line: the story has none, the artboard draws one
      ...INTRO_D5_MASKS, // D-5 (spec 11.4): the banks moved off the HUD, the beams' apexes with them
    ],
  });
  expect(ratio).toBeLessThanOrEqual(0.02);
});

test("Intro Phone story is the column, not the stage (390px)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "the phone is the mobile project's 390x844");
  await page.goto(story("features-intro--phone"));
  await page.locator('#storybook-root main[data-hold="done"]').waitFor();
  await expect(page.locator('[data-intro-layout="column"]')).toBeVisible();
  await expect(page.locator('[data-intro-layout="stage"] [data-stage]')).toBeHidden();
  await expect(page.getByRole("link", { name: /ENTER THE ARENA/ })).toBeVisible();
});

test("Intro Desktop story is the stage with the page's own copy", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the stage is the desktop project's 1440x900");
  await page.goto(story("features-intro--desktop"));
  await page.locator('#storybook-root main[data-hold="done"]').waitFor();
  await expect(page.locator('[data-intro-layout="stage"] [data-stage]')).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Yash Sarda");
});
