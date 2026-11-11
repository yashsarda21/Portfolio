import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { ROUTES } from "../../src/shell/routes";

// The BACK button (owner 2026-11-07): one page back from inside the site, else the Hub (the Hub's own: Home).
const back = (page: Page) => page.getByRole("button", { name: ui.hud.backName });

test("BACK steps back to the page the visitor came from", async ({ page }) => {
  await page.goto(ROUTES.arena);
  await page.locator(`a[href="${ROUTES.career}"]:visible`).first().click();
  await expect(page).toHaveURL(ROUTES.career);
  await back(page).click();
  await expect(page).toHaveURL(ROUTES.arena);
});

test("BACK on a page opened directly goes to the Hub, and the Hub's goes Home", async ({
  page,
  context,
}) => {
  await page.goto(ROUTES.career);
  await back(page).click();
  await expect(page).toHaveURL(ROUTES.arena);

  // A new tab: a reload of the same address would keep the first tab's history entry.
  const direct = await context.newPage();
  await direct.goto(ROUTES.arena);
  await back(direct).click();
  await expect(direct).toHaveURL(ROUTES.home);
});

test("the game page, the Scout report and Full Time show BACK; Home and the Intro do not", async ({
  page,
}) => {
  for (const path of [ROUTES.tennis, ROUTES.scout, ROUTES.fullTime]) {
    await page.goto(path);
    await expect(back(page)).toBeVisible();
    // The button is re-mounted as the page settles, so the box is read again until it is there.
    for (const side of ["height", "width"] as const) {
      await expect
        .poll(async () => (await back(page).boundingBox())?.[side] ?? 0)
        .toBeGreaterThanOrEqual(44);
    }
  }
  for (const path of [ROUTES.home, ROUTES.intro]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeAttached();
    await expect(back(page)).toHaveCount(0);
  }
});
