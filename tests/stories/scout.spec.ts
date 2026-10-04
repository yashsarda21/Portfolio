import { expect, test } from "@playwright/test";
import { expectMatchesArtboard, type Rect } from "../support/visual";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

test("Quick View layout matches the QuickView artboard (artboard copy)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "QuickView is a 1440-wide board");
  await page.setViewportSize({ width: 1440, height: 3300 });
  await page.goto(story("features-quick-view--artboard-parity"));
  await page.locator("#storybook-root > *").first().waitFor();
  const ratio = await expectMatchesArtboard(page, "QuickView", { maxDiffRatio: 0.02 });
  expect(ratio).toBeLessThanOrEqual(0.02);
});

test("Quick View mobile matches Mobile-QuickView (artboard copy)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-QuickView is a 390×844 board");
  await page.goto(story("features-quick-view--artboard-parity"));
  await page.locator("#storybook-root > *").first().waitFor();

  const boxes = async (selector: string) => {
    const found: Rect[] = [];
    for (const el of await page.locator(selector).all()) {
      const box = await el.boundingBox();
      if (box) found.push(box);
    }
    return found;
  };
  const maskRects: Rect[] = [
    // A2 (spec §11): the artboard's 10px mono lines are 11px on mobile, so their glyph boxes differ.
    ...(await boxes("section[aria-labelledby=scout-title] > span:first-child")), // eyebrow
    ...(await boxes("section[aria-labelledby=scout-title] > ul")), // chips
    ...(await boxes("#career article span.type-mono-chip")), // dates
    ...(await boxes("#career > div:first-child > span")), // "2 INNINGS"
    ...(await boxes("#highlights article > span:first-child")), // round labels
    // A10 (spec §11): the scroller's "SWIPE →" hint and right-edge fade are not on the artboard.
    ...(await boxes("#highlights > div:first-child > span")),
    ...(await boxes("#highlights ul + div")),
    // The artboard draws nothing below the highlights, while the real page continues there and
    // shows through the bottom bar's fade (A9). Not yet a logged deviation: see the task report.
    { x: 0, y: 734, width: 390, height: 32 },
  ];

  const ratio = await expectMatchesArtboard(page, "Mobile-QuickView", {
    maxDiffRatio: 0.02,
    maskRects,
  });
  expect(ratio).toBeLessThanOrEqual(0.02);
});
