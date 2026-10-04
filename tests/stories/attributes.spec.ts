import { expect, test } from "@playwright/test";
import { expectMatchesArtboard } from "../support/visual";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

test("Attributes layout matches the Badminton-Attributes artboard (artboard copy)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Badminton-Attributes is a 1440×900 board");
  await page.goto(story("features-attributes--artboard-parity"));
  await page.locator("#storybook-root > *").first().waitFor();
  // The portrait is a lighten-blended image: wait for it to decode before comparing.
  await page.locator("img[alt='Yash Sarda']").evaluate((img: HTMLImageElement) => img.decode());
  const ratio = await expectMatchesArtboard(page, "Badminton-Attributes", {
    maxDiffRatio: 0.02,
    // The segment bars fill in over 350ms; the compare fast-forwards finished animations (animations: "disabled").
    // The COMM line animates in and out (4s on air), so its box is not stable.
    mask: [page.locator("[data-commentary-bar]")],
  });
  expect(ratio).toBeLessThanOrEqual(0.02);
});
