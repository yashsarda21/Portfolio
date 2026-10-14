import { expect, test } from "@playwright/test";
import { expectMatchesArtboard } from "../support/visual";

/** The second shelf of the 1440×900 board: the cabinet's 872px width (x 36–908), from under the shelf light (y 558) to the cabinet's foot (y 864): its trophies, spotlights and names. */
const SHELF_TWO = { x: 36, y: 558, width: 872, height: 306 };

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

test("Trophies layout matches the Trophy-Room artboard (artboard copy)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Trophy-Room is a 1440×900 board");
  await page.goto(story("features-trophies--artboard-parity"));
  await page.locator("#storybook-root > *").first().waitFor();
  // Logged deviation (Phase 6): the artboard's second shelf draws the locked "Giant Killer" outline as its third
  // cell, and the cabinet now holds five trophies with the second shelf's two centred. So the whole second
  // shelf is masked. The rest of the board is compared whole: the compare takes
  // the end state of the spotlight drop (animations: "disabled"), and the cup's turntable stands at 0 degrees,
  // the angle the artboard is drawn at.
  const ratio = await expectMatchesArtboard(page, "Trophy-Room", {
    maxDiffRatio: 0.02,
    maskRects: [SHELF_TWO],
  });
  expect(ratio).toBeLessThanOrEqual(0.02);
});
