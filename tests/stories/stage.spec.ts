import { expect, test } from "@playwright/test";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

test("Stage: the mono floor leaves a 12px hint at 12px on the 1440×900 stage", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the 1440×900 stage");
  await page.goto(story("layout-stage--mono-floor"));
  const hint = page.getByTestId("floor-hint");
  await expect(hint).toBeVisible();
  const size = await hint.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBe(12);
});

test("Stage: a smaller stage grows the hint so it renders at 11px or more", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the 1440×900 stage");
  await page.setViewportSize({ width: 1024, height: 640 });
  await page.goto(story("layout-stage--mono-floor"));
  const hint = page.getByTestId("floor-hint");
  await expect(hint).toBeVisible();
  const { size, scale } = await hint.evaluate((el) => ({
    size: parseFloat(getComputedStyle(el).fontSize),
    scale: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--stage-scale")),
  }));
  expect(scale).toBeLessThan(1);
  expect(size * scale).toBeGreaterThanOrEqual(11 - 0.01);
});
