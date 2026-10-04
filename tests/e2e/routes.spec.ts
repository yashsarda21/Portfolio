import { expect, test } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { ROUTES } from "../../src/shell/routes";
import { expectNoA11yViolations } from "../support/a11y";
import { expectMatchesArtboard } from "../support/visual";

const entries = Object.entries(ROUTES) as [keyof typeof ROUTES, string][];

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  for (const [key, path] of entries) {
    test(`renders without JavaScript: ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes[key].heading, {
        ignoreCase: true,
      });
      await expect(page).toHaveTitle(ui.routes[key].title);
    });
  }
});

for (const [, path] of entries) {
  test(`a11y: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoA11yViolations(page);
  });
}

test("unknown paths show Out of Bounds", async ({ page }) => {
  await page.goto("/definitely-not-a-page");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.notFound.heading, {
    ignoreCase: true,
  });
});

test("focus moves to the new heading after a wipe navigation", async ({ page }) => {
  await page.goto(ROUTES.career);
  await page
    .getByRole("navigation", { name: ui.placeholder.siteMap })
    .getByRole("link", { name: ui.routes.highlights.heading })
    .click();
  await expect(page.locator("[data-wipe] > div").first()).toBeVisible();
  await expect(page).toHaveURL(ROUTES.highlights);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page.locator("[data-wipe] > div").first()).toBeHidden();
});

test("reduced motion navigates without the wipe", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(ROUTES.career);
  await page
    .getByRole("navigation", { name: ui.placeholder.siteMap })
    .getByRole("link", { name: ui.routes.scout.heading })
    .click();
  await expect(page).toHaveURL(ROUTES.scout);
  await expect(page.locator("[data-wipe] > div").first()).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
});

test("stage scales to fit", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile") {
    await page.goto("/");
    await expect(page.locator("[data-stage]")).toBeHidden();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    return;
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  const box = (await page.locator("[data-stage]").boundingBox())!;
  expect(Math.round(box.width)).toBe(1152);
  expect(Math.round(box.height)).toBe(720);
  expect(Math.round(box.x)).toBe(64);
});

test("home matches the Main artboard", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Main is a 1440×900 board");
  await page.goto("/");
  await page.waitForTimeout(3800); // floodlight flicker settles
  const ratio = await expectMatchesArtboard(page, "Main", {
    maxDiffRatio: 0.03,
    maskRects: [
      { x: 560, y: 368, width: 320, height: 52 }, // subtitle tracking (carry-over, Phase 3)
      { x: 30, y: 815, width: 400, height: 60 }, // commentary line animates in
    ],
  });
  expect(ratio).toBeLessThanOrEqual(0.03);
});
