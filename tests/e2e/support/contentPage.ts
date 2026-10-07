import { expect, type Page } from "@playwright/test";

const MOBILE = { width: 390, height: 844 } as const;
/** The mobile tab bar (MobileTabBar carries this attribute so base.css can pad scrolling around it). */
const TAB_BAR = "nav[data-bottom-actions]";
const FOCUSABLE =
  "a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex='-1'])";

/** Resolves once React has taken over the prerendered page (ArenaShell sets `data-hydrated` on <html>). Keys pressed before this do nothing. */
export async function waitForHydration(page: Page) {
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

/** The commentary bar, by its own hook. It animates in and out, so visual tests mask it. */
export const commentaryBar = (page: Page) => page.locator("[data-commentary-bar]");

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

/**
 * The next-venue button keeps its label on one line, inside the window, at each width. (The button has a
 * fixed height, so a wrapped label would not make it taller: count the lines of the label itself.)
 */
export async function expectNextButtonOneLine(
  page: Page,
  name: RegExp,
  widths: readonly number[],
  height = 900,
) {
  // In main: the phone's tab bar can carry a link of the same name (TEAM UP).
  const next = page.locator("main#main").getByRole("link", { name });
  for (const width of widths) {
    await page.setViewportSize({ width, height });
    await expect(next, `next button at ${width}px`).toBeVisible();
    await expect
      .poll(
        () =>
          next.evaluate((el, viewport) => {
            // The label is the one in-flow child; the other is the decorative plate.
            const label = el.querySelector<HTMLElement>(":scope > span:not([data-plate])")!;
            const lineHeight = parseFloat(getComputedStyle(label).fontSize); // the recipe's line-height is 1
            const box = el.getBoundingClientRect();
            return {
              lines: Math.round(label.getBoundingClientRect().height / lineHeight),
              inside: box.left >= 0 && box.right <= viewport,
            };
          }, width),
        { message: `next button at ${width}px: one line, inside the window` },
      )
      .toEqual({ lines: 1, inside: true });
  }
}

/** One main landmark (id "main") holding exactly one h1. */
export async function expectMainLandmarks(page: Page) {
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.locator("main#main")).toHaveCount(1);
  await expect(page.locator("main#main").getByRole("heading", { level: 1 })).toHaveCount(1);
}

/**
 * At phone width the fixed tab bar never hides a control. Two checks:
 * 1. At the end of the page, the last control sits above the bar (the layout leaves room for it).
 * 2. From the top, the first control that lies under the bar's top edge is focused: the browser scrolls it
 *    into view and `scroll-padding-bottom` (base.css, from `data-bottom-actions`) stops it behind the bar.
 */
export async function expectTabBarClear(page: Page) {
  await page.setViewportSize(MOBILE);
  const tabBar = page.locator(TAB_BAR);
  await expect(tabBar).toBeVisible();

  const clearanceOf = (control: ReturnType<Page["locator"]>) => async () => {
    const [bar, box] = await Promise.all([tabBar.boundingBox(), control.boundingBox()]);
    expect(bar, "tab bar box").not.toBeNull();
    expect(box, "control box").not.toBeNull();
    return bar!.y - (box!.y + box!.height);
  };

  // 1. The last control in main (not one of the bar's own links), with the page scrolled to its end.
  await page.evaluate(
    ({ focusable, bar }) => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      const last = [...document.querySelectorAll<HTMLElement>(`main ${focusable}`)]
        .filter((el) => !el.closest(bar) && el.getClientRects().length > 0)
        .at(-1);
      last?.setAttribute("data-e2e-last", "");
    },
    { focusable: FOCUSABLE, bar: TAB_BAR },
  );
  const last = page.locator("[data-e2e-last]");
  await expect(last, "main has a focusable control").toHaveCount(1);
  await expect.poll(clearanceOf(last)).toBeGreaterThanOrEqual(0);

  // 2. From the top: the first control not entirely above the bar's top edge (it straddles or sits below it).
  await page.evaluate(
    ({ focusable, bar }) => {
      window.scrollTo(0, 0);
      const barTop = document.querySelector(bar)!.getBoundingClientRect().top;
      const under = [...document.querySelectorAll<HTMLElement>(`main ${focusable}`)].find(
        (el) =>
          !el.closest(bar) &&
          el.getClientRects().length > 0 &&
          el.getBoundingClientRect().bottom > barTop,
      );
      under?.setAttribute("data-e2e-under-bar", "");
    },
    { focusable: FOCUSABLE, bar: TAB_BAR },
  );
  const under = page.locator("[data-e2e-under-bar]");
  await expect(under, "a control lies under the tab bar's top edge").toHaveCount(1);
  await under.focus();
  await expect.poll(clearanceOf(under)).toBeGreaterThanOrEqual(0);
}
