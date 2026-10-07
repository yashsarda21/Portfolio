import { expect, test } from "@playwright/test";
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

test("Landing phone matches the Mobile-Landing artboard (artboard copy)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-Landing is a 390×844 board");
  await page.goto(story("features-landing--phone"));
  await page.locator("#storybook-root [data-landing-column]").waitFor();
  const column = page.locator("[data-landing-column]");
  const ratio = await expectMatchesArtboard(page, "Mobile-Landing", {
    maxDiffRatio: 0.02,
    // A2: the board's 10px labels are 11px on the page, so each label's box is masked (sized to it).
    // L5: the board's toggle reads SOUND OFF, the page starts with sound on: only the state word is masked.
    mask: [
      column.getByText("LIVE · THE ARENA", { exact: true }),
      column.getByText("01 / 01", { exact: true }),
      column.getByText("STATUS", { exact: true }),
      column.getByText("AWAY", { exact: true }),
      column.getByText("LITE · ONE-THUMB GAMES", { exact: true }),
      column.getByText("RECRUITER VIEW · 90 SEC", { exact: true }),
      column.getByRole("button", { name: /SOUND/ }).locator("span[aria-hidden='true']"),
    ],
  });
  expect(ratio).toBeLessThanOrEqual(0.02);
});
