import { mkdir, writeFile } from "node:fs/promises";
import { expect, test, type Locator } from "@playwright/test";
import { PNG } from "pngjs";
import { cropPng, diffImages, readReference, type Rect } from "../support/visual";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

/** Screenshot an element and compare it with the same window of an artboard. `masks` are relative to the window. */
async function ratioAgainst(
  el: Locator,
  artboard: string,
  size: { width: number; height: number },
  window: Rect,
  masks: Rect[] = [],
): Promise<number> {
  await el.page().evaluate(() => document.fonts.ready);
  const actual = PNG.sync.read(await el.screenshot({ animations: "disabled", caret: "hide" }));
  expect([actual.width, actual.height]).toEqual([window.width, window.height]);
  const expected = cropPng(await readReference(artboard, size.width, size.height), window);
  const { ratio, diff } = diffImages(actual, expected, masks);
  if (process.env.LOG_RATIOS) {
    console.log(`[ratio] ${artboard} ${JSON.stringify(window)} ${ratio}`);
    await mkdir("test-results/visual", { recursive: true });
    const base = `test-results/visual/hub-${window.x}-${window.y}`;
    await writeFile(`${base}.actual.png`, PNG.sync.write(actual));
    await writeFile(`${base}.expected.png`, PNG.sync.write(expected));
    await writeFile(`${base}.diff.png`, PNG.sync.write(diff));
  }
  return ratio;
}

test.describe("Hub.dc.html (1440 x 900)", () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Hub is a 1440×900 board");
  });

  test("the tennis venue card matches the middle card of the artboard", async ({ page }) => {
    await page.goto(story("broadcast-hub--venue-card-arc"));
    // The middle card is only lifted 14px in the artboard, so it has a straight crop (the other two are rotated).
    const card = page.getByTestId("venue-card-tennis");
    await card.waitFor();
    const ratio = await ratioAgainst(
      card,
      "Hub",
      { width: 1440, height: 900 },
      {
        x: 680,
        y: 192,
        width: 348,
        height: 440,
      },
    );
    expect(ratio).toBeLessThanOrEqual(0.02);
  });

  test("the index rail matches the artboard's rail box", async ({ page }) => {
    await page.goto(story("broadcast-hub--index-rail-fidelity"));
    const rail = page.getByTestId("index-rail");
    await rail.waitFor();
    const ratio = await ratioAgainst(
      rail,
      "Hub",
      { width: 1440, height: 900 },
      {
        x: 36,
        y: 104,
        width: 236,
        height: 760,
      },
    );
    expect(ratio).toBeLessThanOrEqual(0.02);
  });
});

test.describe("Mobile-Hub.dc.html (390 x 844)", () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Mobile-Hub is a 390×844 board");
  });

  // The meta row is drawn 10px and shown at 11px (A2, H14): the row is masked, everything else is compared.
  const META: Rect = { x: 16, y: 14, width: 326, height: 14 };

  for (const [venue, y] of [
    ["turf", 186],
    ["court", 328],
    ["hall", 470],
  ] as const) {
    test(`the ${venue} fixture matches the artboard`, async ({ page }) => {
      await page.goto(story("broadcast-hub--venue-fixtures"));
      const fixture = page.getByTestId(`venue-fixture-${venue}`);
      await fixture.waitFor();
      const ratio = await ratioAgainst(
        fixture,
        "Mobile-Hub",
        { width: 390, height: 844 },
        { x: 16, y, width: 358, height: 130 },
        [META],
      );
      expect(ratio).toBeLessThanOrEqual(0.02);
    });
  }
});
