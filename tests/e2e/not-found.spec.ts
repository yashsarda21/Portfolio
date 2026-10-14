import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { ROUTES } from "../../src/shell/routes";
import { expectNoA11yViolations } from "../support/a11y";

const PATHS = ["/arena/nope/deeper", "/arena/nope/", "/nope?x=1", "/404"];

const LINKS = [
  { name: ui.notFound.hub, href: ROUTES.arena },
  { name: ui.hud.quickView, href: ROUTES.scout },
  { name: ui.notFound.home, href: ROUTES.home },
];

const links = (page: Page) => page.getByRole("main").getByRole("link");

for (const path of PATHS) {
  test.describe(`OUT OF BOUNDS: ${path}`, () => {
    test("shows the page, noindex, with nothing for axe to flag", async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.notFound.heading, {
        ignoreCase: true,
      });
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page).toHaveTitle(ui.routes.notFound.title);
      await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(1);
      await expectNoA11yViolations(page);
    });

    test("names the path tried (not on /404) and offers the way back", async ({ page }) => {
      await page.goto(path);
      const tried = page.getByRole("main").getByText(ui.notFound.tried);
      if (path === ROUTES.notFound) await expect(tried).toHaveCount(0);
      else await expect(tried).toContainText(new URL(path, "http://x").pathname);
      for (const { name, href } of LINKS) {
        await expect(links(page).filter({ hasText: name }).first()).toHaveAttribute("href", href);
      }
    });
  });
}

test("each way back leaves an unknown address", async ({ page }) => {
  for (const { name, href } of LINKS) {
    await page.goto("/arena/nope/deeper");
    await links(page).filter({ hasText: name }).first().click();
    await expect(page).toHaveURL(href);
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(
      ui.routes.notFound.heading,
      { ignoreCase: true },
    );
  }
});

test("an address that is a script is printed as text, not run", async ({ page }) => {
  await page.goto("/%3Cimg%20src=x%20onerror=document.title='hacked'%3E");
  await expect(page.getByRole("main").getByText(ui.notFound.tried)).toBeVisible();
  await expect(page).toHaveTitle(ui.routes.notFound.title);
  await expect(page.locator("main img")).toHaveCount(0);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("/404 renders with working links", async ({ page }) => {
    await page.goto(ROUTES.notFound);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.notFound.heading, {
      ignoreCase: true,
    });
    for (const { name, href } of LINKS) {
      await expect(links(page).filter({ hasText: name }).first()).toHaveAttribute("href", href);
    }
    await links(page).filter({ hasText: ui.hud.quickView }).click();
    await expect(page).toHaveURL(ROUTES.scout);
  });
});

test.describe("the host's 404 file", () => {
  let html = "";
  test.beforeAll(() => {
    html = readFileSync("build/client/404.html", "utf8");
  });
  test("build/client/404.html is the prerendered OUT OF BOUNDS page", () => {
    expect(html).toContain(ui.routes.notFound.heading);
    expect(html).toMatch(/<h1[^>]*>/);
    expect(html).toContain('content="noindex"');
  });
});
