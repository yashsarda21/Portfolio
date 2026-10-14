import { expect, test } from "@playwright/test";
import { waitForFiniteAnimations } from "../support/animations";
import { expectNoA11yViolations } from "../support/a11y";
import { expectMatchesArtboard } from "../support/visual";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

test.describe("Easter-Egg.dc.html (1440 x 900)", () => {
  // Reduced motion: the entrances are at rest, as the artboard is drawn.
  test.use({ reducedMotion: "reduce" });

  test("the Full Time page matches the artboard (artboard copy)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Easter-Egg is a 1440×900 board");
    await page.goto(story("features-full-time--artboard"));
    await page.locator("#storybook-root [data-stage]").waitFor();
    // The artboard strikes YASH through; Full Time never does (F5), so the name's cell is masked (the rest of the
    // board is compared). The artboard also draws a commentary line the story does not have.
    const yash = page
      .getByRole("img", { name: /^Final score/ })
      .locator("span")
      .last();
    console.log(`[mask] YASH name ${JSON.stringify(await yash.boundingBox())}`);
    const ratio = await expectMatchesArtboard(page, "Easter-Egg", {
      maxDiffRatio: 0.02,
      mask: [yash],
      maskRects: [{ x: 36, y: 821, width: 508, height: 43 }],
    });
    console.log(`[ratio] Easter-Egg story ${ratio}`);
    expect(ratio).toBeLessThanOrEqual(0.02);
  });
});

// The stage at 1440 (the desktop project) and the column at 390 (the mobile project).
for (const [name, id] of [
  ["Done", "features-full-time--done"],
  ["Pending", "features-full-time--pending-2"],
] as const) {
  test(`a11y: Full Time ${name}`, async ({ page }) => {
    await page.goto(story(id));
    await page.locator("#storybook-root > *").first().waitFor({ state: "attached" });
    await page.evaluate(() => document.fonts.ready);
    // The verdict, the card and the links rise in over 2.8 s; axe cannot judge a part still fading in.
    await waitForFiniteAnimations(page, { maxMs: 4000 });
    await expectNoA11yViolations(page);
  });
}
