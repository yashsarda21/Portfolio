import { mkdir, writeFile } from "node:fs/promises";
import { expect, test, type Locator } from "@playwright/test";
import { PNG } from "pngjs";
import {
  cropPng,
  diffImages,
  expectMatchesArtboard,
  readReference,
  type Rect,
} from "../support/visual";

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

test.describe("Hub page (1440 x 900)", () => {
  // Reduced motion, as the route's compare: the arc sits where it is drawn.
  test.use({ reducedMotion: "reduce" });

  test("the Hub page matches the artboard (artboard copy)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Hub is a 1440×900 board");
    await page.goto(story("features-hub--artboard-parity"));
    await page.locator("#storybook-root [data-stage]").waitFor();
    const ratio = await expectMatchesArtboard(page, "Hub", {
      maxDiffRatio: 0.02,
      // The chip says YOUR RECORD (spec §11.2 #11, H3): the artboard's says RECORD, so ours is wider.
      mask: [page.locator("[data-stage]").getByText("YOUR RECORD", { exact: true }).locator("..")],
      maskRects: [
        // The index adds QUICK VIEW (spec §11.3, H6), a row the artboard does not draw.
        { x: 55, y: 566, width: 198, height: 46 },
        // The commentary line: the story has none, the artboard draws one.
        { x: 304, y: 821, width: 414, height: 43 },
      ],
    });
    console.log(`[ratio] Hub story ${ratio}`);
    expect(ratio).toBeLessThanOrEqual(0.02);
  });
});

test("the index rail's label and tag never overlap, also at the stage mono floor", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the rail is a desktop part");
  await page.goto(story("broadcast-hub--index-rail-fidelity"));
  const rail = page.getByTestId("index-rail");
  await rail.waitFor();
  // 13.75px is what --stage-mono-min raises the 11px mono to inside a scaled stage (1280x720 and smaller).
  for (const floor of ["0px", "13.75px"]) {
    await page.evaluate(
      (v) => document.documentElement.style.setProperty("--stage-mono-min", v),
      floor,
    );
    const gaps = await rail.locator("nav a").evaluateAll((links) =>
      links.map((a) => {
        const [label, tag] = Array.from(a.children).map((c) => c.getBoundingClientRect());
        return { name: a.textContent, gap: tag!.left - label!.right };
      }),
    );
    for (const row of gaps)
      expect(row.gap, `${row.name} at floor ${floor}`).toBeGreaterThanOrEqual(8);
  }
});

test("the drawer slides out when it closes instead of vanishing", async ({ page }) => {
  await page.goto(story("broadcast-hub--drawer-open"));
  const dialog = page.getByRole("dialog", { name: "Portfolio index" });
  await dialog.waitFor();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toHaveAttribute("open", "");
  // Still on screen, part-way out, in the first moments after closing...
  const during = await dialog.evaluate((el) => ({
    display: getComputedStyle(el).display,
    x: el.getBoundingClientRect().x,
  }));
  expect(during.display).not.toBe("none");
  // ...and gone once the transition has run.
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "INDEX" })).toBeFocused();
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

  // The page is compared whole. What differs on purpose is masked and each box logged:
  //  - INDEX (H2): the artboard has no such button, so its box (it sits left of QUICK VIEW, which stays put)
  //  - the three meta rows, 10px drawn and 11px shown (A2, H14), as in the fixtures above
  // The tab labels (9px drawn) and the tiles' labels (10px) are also shown at 11px, and stay under the limit unmasked.
  test("the Hub phone matches the artboard (artboard copy)", async ({ page }) => {
    await page.goto(story("features-hub--phone"));
    await page.locator("#storybook-root [data-hub-column]").waitFor();
    const column = page.locator("[data-hub-column]");
    const masks = {
      "INDEX button": column.getByRole("button", { name: "INDEX" }),
      "meta rows": column.locator("article > div:first-child > div:first-child"),
    };
    const boxes: Locator[] = [];
    for (const [name, locator] of Object.entries(masks)) {
      for (const [i, one] of (await locator.all()).entries()) {
        console.log(`[mask] ${name} ${i} ${JSON.stringify(await one.boundingBox())}`);
        boxes.push(one);
      }
    }
    const ratio = await expectMatchesArtboard(page, "Mobile-Hub", {
      maxDiffRatio: 0.02,
      mask: boxes,
    });
    console.log(`[ratio] Mobile-Hub story ${ratio}`);
    expect(ratio).toBeLessThanOrEqual(0.02);
  });
});
