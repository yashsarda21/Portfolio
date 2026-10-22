import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { ROUTES } from "../../src/shell/routes";
import { waitForHydration } from "./support/contentPage";
import { seedFullMatchday } from "./support/matchday";

// P10: the real Safari engine (WebKit) at the phone's size. The "webkit" project in playwright.config.ts runs only this file.

/** The page never scrolls sideways, and it has exactly one rendered h1. */
async function expectPhoneBasics(page: Page) {
  await expect(page.getByRole("heading", { level: 1 }), "rendered h1s").toHaveCount(1);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "horizontal overflow (px)").toBeLessThanOrEqual(0);
}

for (const venue of ["cricket", "tennis", "badminton"] as const) {
  test(`${venue} column: one h1, the thumb button on screen, no sideways scroll`, async ({
    page,
  }) => {
    await page.goto(ROUTES[venue]);
    await waitForHydration(page);
    await expectPhoneBasics(page);
    const thumb = page.locator("[data-game-column] [data-part=thumb] button").first();
    // The 3D games' loader holds the thumb zone until the scene is ready (or the 2D game takes over).
    await expect(thumb).toBeVisible({ timeout: 30_000 });
    const box = await thumb.boundingBox();
    const view = page.viewportSize()!;
    expect(box, "the thumb button has a box").not.toBeNull();
    expect(box!.x, "left edge").toBeGreaterThanOrEqual(0);
    expect(box!.y, "top edge").toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width, "right edge").toBeLessThanOrEqual(view.width + 0.5);
    expect(box!.y + box!.height, "bottom edge").toBeLessThanOrEqual(view.height + 0.5);
  });
}

test("full time, after a finished matchday: one h1, the board reads the score, no sideways scroll", async ({
  page,
}) => {
  await seedFullMatchday(page);
  await page.goto(ROUTES.fullTime);
  await waitForHydration(page);
  await expectPhoneBasics(page);
  await expect(
    page.getByRole("img", { name: new RegExp(`^${ui.fullTime.board}`) }),
  ).toHaveAttribute("aria-label", "Final score: You 0, Yash 3");
});
