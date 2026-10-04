import { expect, test } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { expectNoA11yViolations } from "../support/a11y";

test("home page renders its heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: ui.routes.home.heading })).toBeVisible();
});

test("home page has no accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expectNoA11yViolations(page);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("renders without JavaScript", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: ui.routes.home.heading }),
    ).toBeVisible();
  });
});
