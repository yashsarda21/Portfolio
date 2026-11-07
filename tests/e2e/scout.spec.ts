import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { ROUTES } from "../../src/shell/routes";
import { expectRegionMatchesArtboard, readRegions, type Rect } from "../support/visual";

const REFERENCE = { width: 1440, height: 3300 } as const;
const ARTBOARD = "QuickView";

const heroSection = (page: Page) => page.locator("section[aria-labelledby='scout-title']");
const quickActions = (page: Page) => page.getByRole("navigation", { name: ui.scout.actions.label });

/** Waits until the page has stopped scrolling. */
async function settled(page: Page) {
  let last = -1;
  await expect
    .poll(async () => {
      const now = await page.evaluate(() => window.scrollY);
      const done = now === last;
      last = now;
      return done;
    })
    .toBe(true);
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the whole report is in the HTML", async ({ page }) => {
    await page.goto(ROUTES.scout);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Yash Sarda", {
      ignoreCase: true,
    });

    const h2s = [
      ui.scout.career.title,
      ui.scout.highlights.title,
      ui.scout.attributes.title,
      ui.scout.trophies.title,
      ui.scout.academy.title,
      ui.scout.teamUp.headline,
    ];
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(h2s.length);
    for (const name of h2s) {
      await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
    }
  });

  test("section links are anchors, and the resume is a mailto request", async ({ page }) => {
    await page.goto(ROUTES.scout);
    if ((page.viewportSize()?.width ?? 0) >= 768) {
      const nav = page.getByRole("navigation", { name: ui.scout.sectionsNav });
      for (const [id, label] of [
        ["career", ui.scout.nav.career],
        ["highlights", ui.scout.nav.highlights],
        ["attributes", ui.scout.nav.attributes],
        ["trophies", ui.scout.nav.trophies],
        ["teamup", ui.scout.nav.teamUp],
      ]) {
        await expect(nav.getByRole("link", { name: label, exact: true })).toHaveAttribute(
          "href",
          `#${id}`,
        );
      }
    }
    await expect(page.locator('a[href$=".pdf"]')).toHaveCount(0);
    await expect(
      page.locator("#teamup").getByRole("link", { name: ui.scout.resume.rowRequest }),
    ).toHaveAttribute("href", /^mailto:/);
  });
});

test.describe("desktop", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 768, "desktop layout");

  test("matches the Quick View artboard, region by region", async ({ page }) => {
    await page.goto(ROUTES.scout);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Static keeps the same space in the flow, so nothing moves; it stops the sticky header painting over regions.
    await page.addStyleTag({ content: "header{position:static!important}" });

    const regions = await readRegions(ARTBOARD, REFERENCE.width, REFERENCE.height);
    // Mask rects are relative to the region's top-left.
    const inside = (child: Rect, parent: Rect): Rect => ({
      x: child.x - parent.x,
      y: child.y - parent.y,
      width: child.width,
      height: child.height,
    });
    const opts = { reference: REFERENCE };
    const ratios: Record<string, number> = {};
    const failures: string[] = [];
    // Run every region so one failure doesn't hide the others.
    const check = async (key: string, locator: ReturnType<Page["locator"]>, maskRects?: Rect[]) => {
      try {
        ratios[key] = await expectRegionMatchesArtboard(locator, ARTBOARD, key, {
          ...opts,
          ...(maskRects ? { maskRects } : {}),
        });
      } catch (err) {
        failures.push((err as Error).message);
      }
    };

    // BACK, owner 2026-11-07: the button is new and the brand and label beside it move right, so the left group is masked.
    const header = page.locator("header");
    const headerBox = (await header.boundingBox())!;
    const backGroup = (await page
      .getByRole("button", { name: ui.hud.backName })
      .locator("..")
      .boundingBox())!;
    await check("header", header, [inside(backGroup, headerBox)]);
    // R4: the primary CTA label differs from the artboard.
    await check("hero", heroSection(page), [inside(regions.heroCtas!, regions.hero!)]);
    await check("careerHead", page.locator("#career > div:first-child"));
    await check("highlightsHead", page.locator("#highlights > div:first-child"));
    await check("attributes", page.locator("#attributes"));
    await check("trophiesHead", page.locator("#trophies h2").nth(0).locator(".."));
    await check("academyHead", page.locator("#trophies h2").nth(1).locator(".."));
    // R4: the resume row labels differ from the artboard.
    await check("teamup", page.locator("#teamup"), [
      inside(regions.teamupResume!, regions.teamup!),
    ]);
    await check("footer", page.locator("footer"));

    console.log("Quick View region diff ratios:", JSON.stringify(ratios));
    expect(failures).toEqual([]);
  });

  // 768 matters: the header row wraps onto two lines between 768px and about 910px.
  for (const size of [
    { width: 1440, height: 900 },
    { width: 768, height: 1024 },
  ]) {
    test(`every section link scrolls its heading clear of the sticky header at ${size.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto(ROUTES.scout);
      const nav = page.getByRole("navigation", { name: ui.scout.sectionsNav });
      for (const [id, label] of [
        ["career", ui.scout.nav.career],
        ["highlights", ui.scout.nav.highlights],
        ["attributes", ui.scout.nav.attributes],
        ["trophies", ui.scout.nav.trophies],
        ["teamup", ui.scout.nav.teamUp],
      ] as const) {
        await nav.getByRole("link", { name: label, exact: true }).click();
        await expect(page).toHaveURL(new RegExp(`#${id}$`));
        await settled(page);
        const header = (await page.locator("header").boundingBox())!;
        const heading = (await page.locator(`#${id} h2`).first().boundingBox())!;
        expect(
          heading.y,
          `#${id} heading (y ${heading.y}) sits under the header (bottom ${header.y + header.height})`,
        ).toBeGreaterThanOrEqual(header.y + header.height);
      }
    });
  }

  test("the bottom action bar is mobile-only", async ({ page }) => {
    await page.goto(ROUTES.scout);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(quickActions(page)).toBeHidden();
  });
});

test.describe("mobile", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, "mobile layout");

  test("shows the quick actions bar and hides the desktop-only controls", async ({ page }) => {
    await page.goto(ROUTES.scout);
    const bar = quickActions(page);
    await expect(bar).toBeVisible();
    await expect(bar.getByRole("link", { name: ui.scout.actions.card })).toHaveAttribute(
      "href",
      ROUTES.card,
    );
    await expect(bar.getByRole("link", { name: ui.scout.actions.teamUp })).toHaveAttribute(
      "href",
      "#teamup",
    );
    await expect(heroSection(page).getByRole("link")).toHaveCount(0);
    await expect(page.locator("header nav")).toBeHidden();
  });

  test("the highlights row scrolls sideways and can take focus", async ({ page }) => {
    await page.goto(ROUTES.scout);
    const list = page.getByRole("list", { name: ui.scout.highlights.list, exact: true });
    await list.scrollIntoViewIfNeeded();
    await expect(list).toBeVisible();
    await list.focus();
    await expect(list).toBeFocused();
    expect(await list.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await expect(page.getByText(ui.scout.highlights.swipe, { exact: false })).toBeVisible();
  });

  test("a keyboard-focused link is never hidden under the bottom bar", async ({ page }) => {
    await page.goto(ROUTES.scout);
    const last = page.locator("#teamup").getByRole("link").last();
    // Park the link just inside the viewport's bottom edge, which is where the bar sits. The browser
    // thinks it is already visible, so only the page's scroll-padding makes focus scroll it clear.
    await last.evaluate((el) => {
      const bottom = el.getBoundingClientRect().bottom + window.scrollY;
      window.scrollTo(0, bottom - window.innerHeight + 8);
    });
    await last.focus();
    await expect(last).toBeFocused();
    await settled(page);
    const link = (await last.boundingBox())!;
    const bar = (await quickActions(page).boundingBox())!;
    expect(link.y + link.height).toBeLessThanOrEqual(bar.y);
  });

  test("the last link clears the bottom bar", async ({ page }) => {
    await page.goto(ROUTES.scout);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const link = page.locator("footer a");
    await expect(link).toBeInViewport();
    const link$ = (await link.boundingBox())!;
    const bar = (await quickActions(page).boundingBox())!;
    expect(link$.y + link$.height).toBeLessThanOrEqual(bar.y);
  });
});

test("never scrolls sideways", async ({ page }) => {
  await page.goto(ROUTES.scout);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);
  }
});

test.describe("share tags", () => {
  test("/scout has Open Graph tags and Person JSON-LD", async ({ page }) => {
    await page.goto(ROUTES.scout);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      ui.routes.scout.title,
    );
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "profile");

    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    const data = JSON.parse(raw ?? "{}") as Record<string, unknown>;
    expect(data["@type"]).toBe("Person");
    expect(data.name).toBe("Yash Sarda");
  });

  test("the home page is a website with no JSON-LD", async ({ page }) => {
    await page.goto(ROUTES.home);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  });
});
