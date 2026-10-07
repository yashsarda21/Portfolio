import { expect, test } from "@playwright/test";
import { expectMatchesArtboard } from "../support/visual";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

test("Card layout matches the Player-Card artboard (artboard copy)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Player-Card is a 1440×900 board");
  await page.goto(story("features-card--artboard-parity"));
  await page.locator("#storybook-root > *").first().waitFor();
  // The portrait is a lighten-blended image: wait for it to decode before comparing.
  await page.locator("img[alt='Yash Sarda']").evaluate((img: HTMLImageElement) => img.decode());
  const ratio = await expectMatchesArtboard(page, "Player-Card", {
    maxDiffRatio: 0.02,
    // The compare cancels the card's float and sheen (animations: "disabled"), so the card rests in its first
    // frame (rotateY -12, rotateX 5), which is the frame the artboard reference rests in too.
    // COMM: the line animates in and out (4s on air), so its box is not stable. A fixed area, not the element:
    // it may already be gone when the compare looks for it.
    maskRects: [{ x: 24, y: 812, width: 392, height: 60 }],
  });
  expect(ratio).toBeLessThanOrEqual(0.02);
});
