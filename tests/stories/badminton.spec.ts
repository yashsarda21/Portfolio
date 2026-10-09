import { expect, test, type Locator } from "@playwright/test";
import { waitForFiniteAnimations } from "../support/animations";
import { expectMatchesArtboard } from "../support/visual";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

/** Logs each mask and the box it covers, so the report can say what was left out and why. */
async function logged(masks: Record<string, Locator>): Promise<Locator[]> {
  const boxes: Locator[] = [];
  for (const [name, locator] of Object.entries(masks)) {
    for (const [i, one] of (await locator.all()).entries()) {
      console.log(`[mask] ${name} ${i} ${JSON.stringify(await one.boundingBox())}`);
      boxes.push(one);
    }
  }
  return boxes;
}

test.describe("Badminton-Play.dc.html (1440 x 900)", () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Badminton-Play is a 1440×900 board");
  });

  // Match point, three rallies played, the hold waiting. What differs on purpose is masked and each box logged (G18):
  //  - the toast column (right-9 top-30 w-85): the board shows two charged and "FRONTEND · LOCKED / WIN RALLY 3",
  //    "ARCHITECTURE · LOCKED"; the game shows three charged in content order and "UP NEXT" (spec §8.3, §11.2 #8 / #24)
  //  - the commentary line: the story has none, the board draws one
  test("match point matches the artboard", async ({ page }) => {
    await page.goto(story("features-games-badminton--artboard-parity"));
    const stage = page.locator("#storybook-root [data-stage]");
    await stage.waitFor();
    await waitForFiniteAnimations(page);
    const boxes = await logged({
      "toast column": stage.locator(".right-9.top-30.w-85"),
    });
    const ratio = await expectMatchesArtboard(page, "Badminton-Play", {
      maxDiffRatio: 0.02,
      mask: boxes,
      maskRects: [{ x: 36, y: 820, width: 650, height: 45 }],
    });
    console.log(`[ratio] Badminton-Play story ${ratio}`);
    expect(ratio).toBeLessThanOrEqual(0.02);
  });
});
