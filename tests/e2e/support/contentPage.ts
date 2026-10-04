import { expect, type Page } from "@playwright/test";

const MOBILE = { width: 390, height: 844 } as const;
/** The mobile tab bar (MobileTabBar carries this attribute so base.css can pad scrolling around it). */
const TAB_BAR = "nav[data-bottom-actions]";
const FOCUSABLE =
  "a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex='-1'])";

/** The page never scrolls sideways: at each width, the document is no wider than the window. */
export async function expectNoHorizontalOverflow(
  page: Page,
  widths: readonly number[],
  height = 900,
) {
  for (const width of widths) {
    await page.setViewportSize({ width, height });
    await expect
      .poll(
        () =>
          page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          ),
        { message: `horizontal overflow at ${width}px` },
      )
      .toBeLessThanOrEqual(0);
  }
}

/** One main landmark (id "main") holding exactly one h1. */
export async function expectMainLandmarks(page: Page) {
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.locator("main#main")).toHaveCount(1);
  await expect(page.locator("main#main").getByRole("heading", { level: 1 })).toHaveCount(1);
}

/**
 * At phone width, with the page scrolled to its end, the last control in the page stays above the fixed
 * tab bar, and keeps clear when it takes focus (scroll-padding-bottom).
 */
export async function expectTabBarClear(page: Page) {
  await page.setViewportSize(MOBILE);
  const tabBar = page.locator(TAB_BAR);
  await expect(tabBar).toBeVisible();

  // The last visible control in main that is not one of the tab bar's own links.
  const marked = await page.evaluate(
    ({ focusable, bar }) => {
      const visible = [...document.querySelectorAll<HTMLElement>(`main ${focusable}`)].filter(
        (el) => !el.closest(bar) && el.getClientRects().length > 0,
      );
      const el = visible.at(-1);
      el?.setAttribute("data-e2e-last", "");
      return Boolean(el);
    },
    { focusable: FOCUSABLE, bar: TAB_BAR },
  );
  expect(marked, "main has a focusable control").toBe(true);
  const control = page.locator("[data-e2e-last]");

  const clearance = async () => {
    const [bar, box] = await Promise.all([tabBar.boundingBox(), control.boundingBox()]);
    expect(bar, "tab bar box").not.toBeNull();
    expect(box, "last control box").not.toBeNull();
    return bar!.y - (box!.y + box!.height);
  };

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(clearance).toBeGreaterThanOrEqual(0);

  await control.focus();
  await expect.poll(clearance).toBeGreaterThanOrEqual(0);
}
