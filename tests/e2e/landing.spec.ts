import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { expectNoA11yViolations } from "../support/a11y";
import { waitForHydration } from "./support/contentPage";

test.beforeEach(({ browserName }, testInfo) => {
  void browserName; // Playwright needs a destructured fixture here
  test.skip(
    testInfo.project.name !== "desktop",
    "the desktop Landing (phone and tablet have their own blocks)",
  );
});

const enter = (page: Page) => page.getByRole("link", { name: ui.landing.enter });
const quick = (page: Page) => page.getByRole("link", { name: ui.landing.view });
const name = (page: Page) => page.getByRole("heading", { level: 1, name: ui.routes.home.heading });

/** Resolves once the CTA group has finished its entrance, in real time (the boot is over). */
const bootDone = (page: Page) =>
  page.evaluate(async () => {
    const group = document.querySelector("a[href='/intro']")!.parentElement!.parentElement!;
    await Promise.all(group.getAnimations().map((a) => a.finished));
  });

/** Freeze every animation at `ms` into the show, so a test can look at one moment without racing the clock. */
const seekBoot = (page: Page, ms: number) =>
  page.evaluate((t) => {
    for (const a of document.getAnimations()) {
      a.pause();
      a.currentTime = t;
    }
  }, ms);

/** The accessible names of the next `count` stops of Tab, from the top of the page. */
async function tabStops(page: Page, count: number): Promise<string[]> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const stops: string[] = [];
  for (let i = 0; i < count; i++) {
    await page.keyboard.press("Tab");
    stops.push(
      await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return "(page)";
        return el.getAttribute("aria-label") ?? (el as HTMLElement).innerText.trim();
      }),
    );
  }
  return stops;
}

test.describe("boot order", () => {
  test("at 0.2 s the name is faded out and the calls to action cannot take focus", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForHydration(page);
    await seekBoot(page, 200);
    const visibility = (sel: string) =>
      page.evaluate((s) => getComputedStyle(document.querySelector(s)!).visibility, sel);
    // The name is not interactive: it stays in the page (readable, focusable) and only fades in.
    expect(await visibility("h1")).toBe("visible");
    expect(await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).opacity)).toBe(
      "0",
    );
    expect(await visibility("a[href='/intro']")).toBe("hidden");
    expect(await visibility("a[href='/scout']")).toBe("hidden");

    const stops = await tabStops(page, 6);
    expect(stops.join(" | ")).toContain(ui.hud.skipIntro);
    expect(stops.join(" | ")).not.toContain(ui.landing.enter);
    expect(stops.join(" | ")).not.toContain(ui.landing.view);
  });

  test("the scenery enters on Main's beats: dark at 0.5 s, fully lit at the end", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForHydration(page);
    const opacity = (part: string) =>
      page.evaluate(
        (p) => Number(getComputedStyle(document.querySelector(`[data-part="${p}"]`)!).opacity),
        part,
      );
    const letterbox = () =>
      page.evaluate(() =>
        Number(
          getComputedStyle(document.querySelector("[data-transition-scene] > .scene-sky")!).opacity,
        ),
      );
    await seekBoot(page, 500);
    // Only the crowd (.3 s) has begun; the sky, field and pitch wait until 2.2 s and later.
    for (const part of ["sky", "field", "pitch", "cone-left", "cone-right"])
      expect(await opacity(part), part).toBeLessThan(0.1);
    expect(await letterbox()).toBeLessThan(0.1);
    // The crowd is mid-fade at 0.5 s (.3 s delay, 1.8 s ease-out).
    expect(await opacity("crowd")).toBeLessThan(0.5);
    // At 6 s every layer has finished.
    await seekBoot(page, 6000);
    for (const part of ["sky", "field", "pitch", "cone-left", "cone-right", "crowd"])
      expect(await opacity(part), part).toBe(1);
    expect(await letterbox()).toBe(1);
  });

  test("after the boot, Tab reaches both calls to action", async ({ page }) => {
    await page.goto("/");
    await bootDone(page);
    await expect(name(page)).toBeVisible();
    const stops = await tabStops(page, 8);
    expect(stops.join(" | ")).toContain(ui.landing.enter);
    expect(stops.join(" | ")).toContain(ui.landing.view);
  });

  test("the board has no accessibility violations at the end of the boot", async ({ page }) => {
    await page.goto("/");
    await bootDone(page);
    await expectNoA11yViolations(page);
  });
});

test.describe("return visit", () => {
  test("plays the cut-down: the calls to action are in by 1.6 s", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("arena:landing-seen", "1"));
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-return-visit", "");
    // The end of the CTA group's entrance on the show's own clock (not the wall clock, so a busy machine cannot fail it).
    const end = await page.evaluate(() => {
      const group = document.querySelector("a[href='/intro']")!.parentElement!.parentElement!;
      return Math.max(
        ...group.getAnimations().map((a) => Number(a.effect!.getComputedTiming().endTime)),
      );
    });
    expect(end).toBeLessThanOrEqual(1600);
    await bootDone(page);
    await enter(page).focus();
    await expect(enter(page)).toBeFocused();
    await expect(quick(page)).toBeVisible();
  });

  test("coming back in the same session plays the cut-down too", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await bootDone(page);
    // The commentary line is the last beat; it marks the boot as played.
    await expect(page.locator("[data-commentary-bar]")).toBeVisible();
    await quick(page).click();
    await expect(page).toHaveURL("/scout");
    await page.goBack();
    await expect(page).toHaveURL("/");
    await expect(page.locator("html")).toHaveAttribute("data-return-visit", "");
    const end = await page.evaluate(() => {
      const group = document.querySelector("a[href='/intro']")!.parentElement!.parentElement!;
      return Math.max(
        ...group.getAnimations().map((a) => Number(a.effect!.getComputedTiming().endTime)),
      );
    });
    expect(end).toBeLessThanOrEqual(1600);
    await bootDone(page);
    await enter(page).focus();
    await expect(enter(page)).toBeFocused();
  });

  test("the first visit marks the browser, so the next one is quick", async ({ page }) => {
    await page.goto("/");
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("arena:landing-seen")))
      .toBe("1");
  });
});

test.describe("shortcuts (A8)", () => {
  test("Enter plays and Q opens Quick View", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/intro");

    await page.goto("/");
    await waitForHydration(page);
    await page.keyboard.press("q");
    await expect(page).toHaveURL("/scout");
  });

  test("Ctrl+Q does nothing", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await page.keyboard.press("Control+q");
    await page.keyboard.press("Alt+Enter");
    await page.waitForTimeout(600);
    await expect(page).toHaveURL("/");
  });

  test("Enter on VIEW PORTFOLIO is that link's own action, once", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await bootDone(page);
    await quick(page).focus();
    let navigations = 0;
    page.on("framenavigated", () => navigations++);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/scout");
    await page.waitForTimeout(800);
    expect(navigations).toBe(1);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the CSS boot still ends with everything in place", async ({ page }) => {
    await page.goto("/");
    await expect(name(page)).toBeVisible({ timeout: 10_000 });
    await expect(enter(page)).toBeVisible({ timeout: 10_000 });
    await expect(quick(page)).toBeVisible();
    await expect(page.getByRole("link", { name: ui.hud.skipIntro })).toBeVisible();
    await expect(enter(page)).toHaveAttribute("href", "/intro");
    await expect(quick(page)).toHaveAttribute("href", "/scout");
    await expect(page.getByRole("link", { name: ui.hud.skipIntro })).toHaveAttribute(
      "href",
      "/arena",
    );
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("everything is there at once and no rig frames are requested", async ({ page }) => {
    const strips: string[] = [];
    page.on("request", (r) => /turn_[012]/.test(r.url()) && strips.push(r.url()));
    await page.goto("/");
    await expect(name(page)).toBeVisible();
    for (const target of [name(page), enter(page), quick(page)]) {
      await expect(target).toBeVisible();
      expect(await target.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    }
    await expect(page.getByText(ui.landing.hint)).toBeVisible();
    await page.waitForTimeout(3000);
    expect(strips).toEqual([]);
  });
});

test("the intro's head-turn frames are fetched after the page has loaded", async ({ page }) => {
  const strips = new Set<string>();
  page.on("request", (r) => /turn_[012]/.test(r.url()) && strips.add(r.url()));
  await page.goto("/");
  await expect.poll(() => strips.size, { timeout: 8000 }).toBe(3);
});

test("exactly one h1 is rendered at every width", async ({ page }) => {
  for (const [width, height] of [
    [1440, 900],
    [1200, 800],
    [1199, 800],
    [1024, 768],
    [768, 1024],
    [390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 }), `${width}px`).toHaveCount(1);
  }
});
