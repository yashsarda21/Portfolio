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

test.describe("Cricket-Play.dc.html (1440 x 900)", () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Cricket-Play is a 1440×900 board");
  });

  test("the fresh over matches the artboard (the story has no commentary line)", async ({
    page,
  }) => {
    await page.goto(story("features-games-cricket--artboard-parity"));
    await page.locator("#storybook-root [data-stage]").waitFor();
    await waitForFiniteAnimations(page);
    const ratio = await expectMatchesArtboard(page, "Cricket-Play", {
      maxDiffRatio: 0.02,
      // The commentary line: the story has none, the artboard draws one.
      maskRects: [{ x: 36, y: 820, width: 350, height: 45 }],
    });
    console.log(`[ratio] Cricket-Play story ${ratio}`);
    expect(ratio).toBeLessThanOrEqual(0.02);
  });
});

test.describe("Mobile-Game.dc.html (390 x 844)", () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Mobile-Game is a 390×844 board");
  });

  // After ball 1, a SIX. What differs on purpose is masked and each box logged:
  //  - QUICK VIEW (A5, G11): the board has no such chip, so its box
  //  - the reveal chip's eyebrow, drawn 10px and shown at 11px (A2), and the tag drawn 9px
  test("the phone after ball 1 matches the artboard", async ({ page }) => {
    await page.goto(story("features-games-cricket--phone-artboard-parity"));
    const column = page.locator("#storybook-root [data-game-column]");
    await column.waitFor();
    await waitForFiniteAnimations(page);
    const boxes = await logged({
      "QUICK VIEW chip": column.getByRole("link", { name: "QUICK VIEW" }),
      "reveal eyebrow": column.getByText("INNINGS 01 UNLOCKED · NOT OUT"),
      "ON STRIKE tag": column.getByText("YASH · ON STRIKE"),
    });
    const ratio = await expectMatchesArtboard(page, "Mobile-Game", {
      maxDiffRatio: 0.02,
      mask: boxes,
    });
    console.log(`[ratio] Mobile-Game story ${ratio}`);
    expect(ratio).toBeLessThanOrEqual(0.02);
  });
});
