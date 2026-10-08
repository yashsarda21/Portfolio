import { expect, test } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { ROUTES } from "../../src/shell/routes";
import { expectNoA11yViolations } from "../support/a11y";
import { expectMatchesArtboard } from "../support/visual";

const entries = Object.entries(ROUTES) as [keyof typeof ROUTES, string][];

/** The Hub's phone and tablet column is Phase 4 Task 6: until it lands, below 1200px /arena shows only its hidden stage. */
const hubColumnPending = (path: string, project: string) =>
  path === ROUTES.arena && project === "mobile";

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  for (const [key, path] of entries) {
    test(`renders without JavaScript: ${path}`, async ({ page }, testInfo) => {
      test.skip(hubColumnPending(path, testInfo.project.name), "the Hub column arrives in Task 6");
      await page.goto(path);
      // The card page is "PLAYER CARD" in the trail and the title, and "PLAYER PROFILE" on the board's h1.
      // The Intro's h1 is the name, on the stage and in the phone's column alike.
      const heading =
        key === "card"
          ? ui.pages.card.titleLines.join(" ")
          : key === "intro"
            ? ui.routes.home.heading
            : ui.routes[key].heading;
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading, {
        ignoreCase: true,
      });
      await expect(page).toHaveTitle(ui.routes[key].title);
    });
  }
});

for (const [, path] of entries) {
  test(`a11y: ${path}`, async ({ page }, testInfo) => {
    test.skip(hubColumnPending(path, testInfo.project.name), "the Hub column arrives in Task 6");
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The Intro plays for 6.5 s, and axe judges a page at rest.
    if (path === ROUTES.intro)
      await expect(page.locator("main#main")).toHaveAttribute("data-hold", "done", {
        timeout: 15_000,
      });
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
  // A page that is still a placeholder (they carry the site map).
  await page.goto(ROUTES.lockerRoom);
  await page
    .getByRole("navigation", { name: ui.placeholder.siteMap })
    .getByRole("link", { name: ui.routes.highlights.heading })
    .click();
  await expect(page.locator("[data-wipe] > div").first()).toBeVisible();
  await expect(page).toHaveURL(ROUTES.highlights);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page.locator("[data-wipe] > div").first()).toBeHidden();
});

test("focus lands on the rendered heading of the landing page, not its hidden twin", async ({
  page,
}) => {
  // "/" holds two <h1>s (desktop Scoreboard, phone/tablet column); only one is rendered per breakpoint.
  // A page that is still a placeholder (they carry the site map).
  await page.goto(ROUTES.lockerRoom);
  await page
    .getByRole("navigation", { name: ui.placeholder.siteMap })
    .getByRole("link", { name: ui.routes.home.heading })
    .click();
  await expect(page).toHaveURL(ROUTES.home);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
});

test("journey: Landing → Quick View", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the Landing CTAs are the desktop Scoreboard");
  await page.goto(ROUTES.home);
  await page.getByRole("link", { name: ui.landing.view }).click();
  await expect(page).toHaveURL(ROUTES.scout);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page).toHaveTitle(ui.routes.scout.title);
});

test("reduced motion navigates without the wipe", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // A page that is still a placeholder (they carry the site map).
  await page.goto(ROUTES.lockerRoom);
  await page
    .getByRole("navigation", { name: ui.placeholder.siteMap })
    .getByRole("link", { name: ui.routes.scout.navLabel })
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

test("stage mono labels stay at 11px or more on screen (L2)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the stage is hidden on phones");
  // The keyboard hint (12px recipe) and a scoreboard footer label (11px recipe), as rendered, times the stage scale.
  const read = () =>
    page.evaluate(
      ({ hint, label }) => {
        const size = (text: string) => {
          const el = [...document.querySelectorAll<HTMLElement>("[data-stage] *")].find(
            (e) => e.children.length === 0 && e.textContent?.trim() === text,
          )!;
          return parseFloat(getComputedStyle(el).fontSize);
        };
        const scale = parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--stage-scale"),
        );
        return { hint: size(hint), label: size(label), scale };
      },
      { hint: ui.landing.hint, label: ui.landing.home },
    );

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  const small = await read();
  expect(small.scale).toBeCloseTo(0.8, 2);
  expect(small.hint * small.scale).toBeGreaterThanOrEqual(11 - 0.01);
  expect(small.label * small.scale).toBeGreaterThanOrEqual(11 - 0.01);

  // At 1440×900 the scale is 1 and nothing changes: the hint is its recipe size.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const full = await read();
  expect(full.scale).toBe(1);
  expect(full.hint).toBe(12);
  expect(full.label).toBe(11);
});

test("home matches the Main artboard", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Main is a 1440×900 board");
  await page.goto("/");
  // The boot is over when the CTA group, the last scoreboard-area part to enter, has finished its entrance.
  // (Playwright's animations: "disabled" would also run the finite animations to their last frame; waiting
  // for the real end makes the check say the show itself ends on Main's board.)
  await page.evaluate(async () => {
    const group = document.querySelector("a[href='/intro']")!.parentElement!.parentElement!;
    await Promise.all(group.getAnimations().map((a) => a.finished));
  });
  const ratio = await expectMatchesArtboard(page, "Main", {
    maxDiffRatio: 0.02,
    maskRects: [
      { x: 560, y: 368, width: 320, height: 52 }, // subtitle tracking (carry-over, Phase 3)
      { x: 30, y: 815, width: 400, height: 60 }, // commentary line animates in
      // D-1 (spec §11.4): our cone tops start under each lamp, Main's are drawn offset. Sized to the
      // differing wedge only (not the whole cone box, never the scoreboard or CTAs).
      { x: 106, y: 120, width: 78, height: 142 }, // left cone
      { x: 1255, y: 120, width: 80, height: 151 }, // right cone
    ],
  });
  expect(ratio).toBeLessThanOrEqual(0.02);
});
