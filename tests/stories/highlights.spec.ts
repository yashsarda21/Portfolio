import { expect, test } from "@playwright/test";
import { expectMatchesArtboard } from "../support/visual";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

test("Highlights layout matches the Tennis-Highlights artboard (artboard copy)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Tennis-Highlights is a 1440×900 board");
  await page.goto(story("features-highlights--artboard-parity"));
  await page.locator("#storybook-root > *").first().waitFor();
  const ratio = await expectMatchesArtboard(page, "Tennis-Highlights", {
    maxDiffRatio: 0.02,
    // The COMM line animates in and out (4s on air), so its box is not stable.
    mask: [page.locator("[data-commentary-bar]")],
  });
  expect(ratio).toBeLessThanOrEqual(0.02);
});

test("a long draw scrolls inside its panel and keeps keyboard focus in view", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the draw scrolls from 1200px up");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(story("features-highlights--long-draw"));
  const tablist = page.getByRole("tablist");
  await tablist.waitFor();

  const scroller = tablist.locator("xpath=..");
  const metrics = () =>
    scroller.evaluate((el) => ({ scroll: el.scrollHeight, client: el.clientHeight }));
  const before = await metrics();
  expect(before.scroll).toBeGreaterThan(before.client);
  // The draw is no taller than the shot data beside it: it did not push the page.
  const [draw, shot] = await Promise.all([
    scroller.locator("xpath=../..").boundingBox(),
    page.getByRole("heading", { level: 3 }).locator("xpath=..").boundingBox(),
  ]);
  expect(Math.abs(draw!.height - shot!.height)).toBeLessThan(1);

  // Keyboard: End selects the last round and scrolls it into the panel.
  await page.getByRole("tab", { selected: true }).focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("End");
  const [box, area] = await Promise.all([
    page.getByRole("tab", { selected: true }).boundingBox(),
    scroller.boundingBox(),
  ]);
  expect(box!.y).toBeGreaterThanOrEqual(area!.y - 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(area!.y + area!.height + 1);
});
