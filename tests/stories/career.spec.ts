import { expect, test } from "@playwright/test";
import { expectMatchesArtboard } from "../support/visual";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

test("Career layout matches the Cricket-Career artboard (artboard copy)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Cricket-Career is a 1440×900 board");
  await page.goto(story("features-career--artboard-parity"));
  await page.locator("#storybook-root > *").first().waitFor();
  const ratio = await expectMatchesArtboard(page, "Cricket-Career", {
    maxDiffRatio: 0.02,
    // The COMM line animates in and out (4s on air), so its box is not stable.
    mask: [page.locator("[data-commentary-bar]")],
  });
  expect(ratio).toBeLessThanOrEqual(0.02);
});
