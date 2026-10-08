import { expect, test } from "@playwright/test";
import { expectMobileLandingFidelity } from "../support/mobileLanding";
import { expectMatchesArtboard } from "../support/visual";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

test("Landing layout matches the Main artboard (artboard copy)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Main is a 1440×900 board");
  await page.goto(story("features-landing--artboard-parity"));
  await page.locator("#storybook-root [data-stage]").waitFor();
  // animations: "disabled" (the compare) runs every finite animation to its last frame, which is the board at
  // rest, so there is no wait for the 5 s boot.
  const ratio = await expectMatchesArtboard(page, "Main", {
    maxDiffRatio: 0.02,
    maskRects: [
      { x: 560, y: 368, width: 320, height: 52 }, // subtitle tracking (L10, Main's frozen end state)
      { x: 30, y: 815, width: 400, height: 60 }, // the commentary line: the story has none, Main draws one
      // D-1 (spec §11.4): our cone tops start under each lamp, Main's are drawn offset.
      { x: 106, y: 120, width: 78, height: 142 }, // left cone
      { x: 1255, y: 120, width: 80, height: 151 }, // right cone
    ],
  });
  expect(ratio).toBeLessThanOrEqual(0.02);
});

test("Landing phone matches the Mobile-Landing artboard where it was left alone and at the new places of what moved (artboard copy)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-Landing is a 390×844 board");
  await page.goto(story("features-landing--phone"));
  await page.locator("#storybook-root [data-landing-column]").waitFor();
  const ratios = await expectMobileLandingFidelity(page, page.locator("[data-landing-column]"), {
    live: "LIVE · THE ARENA",
    playerShort: "01 / 01",
    status: "STATUS",
    away: "AWAY",
    enterSub: "LITE · ONE-THUMB GAMES",
    viewSub: "RECRUITER VIEW · 90 SEC",
  });
  for (const ratio of Object.values(ratios)) expect(ratio).toBeLessThanOrEqual(0.02);
});
