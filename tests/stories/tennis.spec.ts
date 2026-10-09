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

test.describe("Tennis-Play.dc.html (1440 x 900)", () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Tennis-Play is a 1440×900 board");
  });

  // Rally 3 in play, the right side open. What differs on purpose is masked and each box logged (G18):
  //  - the two card blurbs: the board draws short blurbs, the game shows each project's content line (§11.2)
  //  - the serving tag: 194 KM/H at rally 3, the board draws 186
  //  - the commentary line: the story has none, the board draws one
  test("rally 3 in play matches the artboard", async ({ page }) => {
    await page.goto(story("features-games-tennis--artboard-parity"));
    const stage = page.locator("#storybook-root [data-stage]");
    await stage.waitFor();
    await waitForFiniteAnimations(page);
    const boxes = await logged({
      "card blurb": stage.locator("[data-side] > div > span:last-child"),
      "serving tag": stage.getByText("YASH · SERVING"),
    });
    const ratio = await expectMatchesArtboard(page, "Tennis-Play", {
      maxDiffRatio: 0.02,
      mask: boxes,
      maskRects: [{ x: 36, y: 820, width: 650, height: 45 }],
    });
    console.log(`[ratio] Tennis-Play story ${ratio}`);
    expect(ratio).toBeLessThanOrEqual(0.02);
  });
});
