import { expect, test } from "@playwright/test";
import { expectMatchesArtboard } from "../support/visual";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

test("Trophies layout matches the Trophy-Room artboard (artboard copy)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Trophy-Room is a 1440×900 board");
  await page.goto(story("features-trophies--artboard-parity"));
  await page.locator("#storybook-root > *").first().waitFor();
  // Nothing is masked: the compare takes the end state of the spotlight drop (animations: "disabled"),
  // and the cup's turntable stands at 0 degrees, the angle the artboard is drawn at.
  const ratio = await expectMatchesArtboard(page, "Trophy-Room", { maxDiffRatio: 0.02 });
  expect(ratio).toBeLessThanOrEqual(0.02);
});
