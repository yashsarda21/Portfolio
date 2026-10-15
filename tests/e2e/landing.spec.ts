import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { expectNoA11yViolations } from "../support/a11y";
import { expectMobileLandingFidelity } from "../support/mobileLanding";
import {
  actionsGapAt,
  expectBanksClearOfHud,
  expectLightsBelowTopRow,
} from "./support/columnLayout";
import { expectNoHorizontalOverflow, waitForHydration } from "./support/contentPage";

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

test.describe("desktop", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1200, "the desktop Landing");

  test("the four banks clear the HUD (the stage layout is unchanged)", async ({ page }) => {
    await page.goto("/");
    await expect(name(page)).toBeVisible();
    await expectBanksClearOfHud(page, page.locator("[data-stage]"), 4);
  });

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
      expect(
        await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).opacity),
      ).toBe("0");
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
            getComputedStyle(document.querySelector("[data-transition-scene] > .scene-sky")!)
              .opacity,
          ),
        );
      await seekBoot(page, 500);
      // Only the crowd (.3 s) has begun; the sky, field and pitch wait until 2.2 s and later.
      for (const part of ["sky", "field", "pitch", "cone-left", "cone-right", "dust"])
        expect(await opacity(part), part).toBeLessThan(0.1);
      expect(await letterbox()).toBeLessThan(0.1);
      // The crowd is mid-fade at 0.5 s (.3 s delay, 1.8 s ease-out).
      expect(await opacity("crowd")).toBeLessThan(0.5);
      // The dust drifts in the beams (L12): it comes up with the left cone (1 s), not before it.
      await seekBoot(page, 1700);
      const cone = await opacity("cone-left");
      expect(cone).toBeGreaterThan(0);
      expect(cone).toBeLessThan(1);
      expect(await opacity("dust")).toBe(cone);
      // At 6 s every layer has finished.
      await seekBoot(page, 6000);
      for (const part of ["sky", "field", "pitch", "cone-left", "cone-right", "crowd", "dust"])
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

    test("Ctrl+Q and Alt+Enter do nothing: only the plain Enter that follows goes anywhere", async ({
      page,
    }) => {
      await page.goto("/");
      await waitForHydration(page);
      const visited: string[] = [];
      page.on("framenavigated", (frame) => visited.push(new URL(frame.url()).pathname));
      await page.keyboard.press("Control+q");
      await page.keyboard.press("Alt+Enter");
      // The control: a plain Enter plays. If either chord above had gone anywhere first (to Quick View or
      // the intro), the page would have been seen there before, or this Enter would have been swallowed.
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL("/intro");
      expect(visited).toEqual(["/intro"]);
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
      page.on("request", (r) => /turn_[012][^/]*\.webp/.test(r.url()) && strips.push(r.url()));
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
    await page.goto("/");
    // The browser's own record: every strip's request starts, and the page's load event.
    const strips = () =>
      page.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .filter((e) => /turn_[012][^/]*\.webp/.test(e.name))
          .map((e) => ({ name: e.name, start: e.startTime })),
      );
    await expect.poll(async () => (await strips()).length, { timeout: 8000 }).toBe(3);
    const loadStart = await page.evaluate(
      () =>
        (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming)
          .loadEventStart,
    );
    expect(loadStart).toBeGreaterThan(0);
    for (const strip of await strips()) {
      expect(
        strip.start,
        `${strip.name} was requested after the load event began`,
      ).toBeGreaterThanOrEqual(loadStart);
    }
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
});

/** The phone / tablet column (the stage half is display:none there, but its copy is still in the page). */
const column = (page: Page) => page.locator("[data-landing-column]");
const soundToggle = (page: Page) => column(page).getByRole("button", { name: /SOUND/ });

test.describe("phone", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) !== 390, "the 390×844 phone");

  test("matches the Mobile-Landing artboard where it was left alone, and at the new places of what moved (D-2, D-3)", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForHydration(page);
    await seekBoot(page, 6000); // measured at the boot's last frame (the calls to action rise 18px into place)
    const ratios = await expectMobileLandingFidelity(page, column(page), {
      live: ui.landing.live,
      playerShort: ui.landing.playerShort,
      status: ui.landing.status,
      away: ui.landing.away,
      enterSub: ui.landing.enterSubPhone,
      viewSub: ui.landing.viewSub,
    });
    for (const ratio of Object.values(ratios)) expect(ratio).toBeLessThanOrEqual(0.02);
  });

  test("one h1, the stacked name, and nothing sideways", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(name(page)).toBeVisible();
    await expectNoHorizontalOverflow(page, [390], 844);
  });

  test("the sound toggle starts on (L5), labelled SOUND", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    const toggle = soundToggle(page);
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(toggle).toContainText(ui.audio.labelPhone);
    await expect(toggle).toContainText(ui.audio.on);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(toggle).toContainText(ui.audio.off);
  });

  test("the two calls to action, ENTER with the phone sub-line", async ({ page }) => {
    await page.goto("/");
    await expect(enter(page)).toBeVisible();
    await expect(enter(page)).toContainText(ui.landing.enterSubPhone);
    await expect(enter(page)).not.toContainText(ui.landing.enterSub);
    await expect(enter(page)).toHaveAttribute("href", "/intro");
    await expect(quick(page)).toHaveAttribute("href", "/scout");
    for (const link of [enter(page), quick(page), soundToggle(page)]) {
      const box = (await link.boundingBox())!;
      expect(box.height, "44px target").toBeGreaterThanOrEqual(44);
    }
  });

  test("silent: no commentary, no keyboard hint, no SKIP INTRO", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await page.waitForTimeout(6000); // past the desktop's commentary beat
    await expect(page.locator("[data-commentary-bar]")).toHaveCount(0);
    await expect(page.getByText(ui.comm.tag, { exact: true })).toHaveCount(0);
    await expect(page.getByText(ui.landing.hint)).toBeHidden();
    await expect(page.getByRole("link", { name: ui.hud.skipIntro })).toHaveCount(0);
  });

  test("has no accessibility violations", async ({ page }) => {
    await page.goto("/");
    await expect(name(page)).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("ENTER THE ARENA goes to the intro", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await enter(page).click();
    await expect(page).toHaveURL("/intro");
  });
});

test.describe("tablet", () => {
  test.skip(({ hasTouch }) => !hasTouch, "driven from the phone project");
  test.use({ viewport: { width: 768, height: 1024 } });

  test("is the same column, centred, one rendered h1", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const col = (await column(page).locator("h1").boundingBox())!;
    expect(Math.abs(col.x + col.width / 2 - 384)).toBeLessThan(2);
    const cta = (await enter(page).boundingBox())!;
    expect(cta.width).toBeLessThanOrEqual(640);
    expect(cta.width).toBeGreaterThan(400);
    await expect(enter(page)).toContainText(ui.landing.enterSubPhone);
  });

  test("portrait: the board and the challenge line sit together, not a screen apart", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(name(page)).toBeVisible();
    const board = (await column(page).locator("[data-part='board']").boundingBox())!;
    const challenge = (await column(page).getByText(ui.landing.challenge).boundingBox())!;
    expect(challenge.y - (board.y + board.height)).toBeLessThanOrEqual(96);
    // Centred as one block: the space under the buttons is no bigger than the space above the board (plus the top row).
    const quickBox = (await quick(page).boundingBox())!;
    expect(board.y).toBeGreaterThan(60);
    expect(1024 - (quickBox.y + quickBox.height)).toBeGreaterThan(40);
  });

  test("landscape: the floodlight banks sit over the column, not at the window's edges", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await expect(name(page)).toBeVisible();
    const board = (await column(page).locator("[data-part='board']").boundingBox())!;
    for (const side of ["bank-1", "bank-2"]) {
      const bank = (await column(page).locator(`[data-part='${side}']`).boundingBox())!;
      const centre = bank.x + bank.width / 2;
      expect(centre, side).toBeGreaterThanOrEqual(board.x - 40);
      expect(centre, side).toBeLessThanOrEqual(board.x + board.width + 40);
    }
  });

  test("has no accessibility violations", async ({ page }) => {
    await page.goto("/");
    await expect(name(page)).toBeVisible();
    await expectNoA11yViolations(page);
  });
});

/** Below the stage the lights hang under the top row and the board and the actions are one group (D-2, D-3). */
const COLUMN_SIZES = [
  [390, 844],
  [375, 667],
  [360, 640],
  [768, 1024],
  [1024, 768],
  [1180, 820],
] as const;

test.describe("the column's lights and spacing (D-2, D-3)", () => {
  test.skip(({ hasTouch }) => !hasTouch, "driven from the phone project");

  for (const [width, height] of COLUMN_SIZES) {
    test(`${width}×${height}: the lights sit under the top row, and the challenge line sits a fixed gap under the board`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await expect(name(page)).toBeVisible();
      await seekBoot(page, 6000); // the boot's last frame: the calls to action have risen into place
      await expectLightsBelowTopRow(page, column(page));

      const board = (await column(page).locator("[data-part='board']").boundingBox())!;
      const challenge = (await column(page).getByText(ui.landing.challenge).boundingBox())!;
      const gap = challenge.y - (board.y + board.height);
      // One rule for phone and tablet: a fixed gap (40px below 768px, 56px from it), never a screen apart.
      expect(Math.abs(gap - actionsGapAt(width)), `gap ${gap}`).toBeLessThanOrEqual(2);

      // Centred under the top row as one group, wherever the screen is tall enough to hold it.
      const last = (await quick(page).boundingBox())!;
      const scrolls = await page.evaluate(
        () => document.documentElement.scrollHeight > window.innerHeight,
      );
      if (!scrolls) {
        // The group is centred in what is left after 56px under the top row and 24px above the foot.
        const above = board.y - 60 - 56;
        const below = height - (last.y + last.height) - 24;
        expect(Math.abs(above - below), `above ${above}, below ${below}`).toBeLessThanOrEqual(2);
      }

      await expectNoHorizontalOverflow(page, [width], height);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      for (const cta of [enter(page), quick(page)]) {
        await cta.scrollIntoViewIfNeeded();
        const inside = await cta.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const doc = document.documentElement;
          return { left: r.left >= 0, right: r.right <= doc.scrollWidth };
        });
        expect(inside).toEqual({ left: true, right: true });
      }
      const small = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('[class*="type-mono"]')]
          .filter((el) => el.getClientRects().length > 0)
          .map((el) => ({ text: el.textContent, size: parseFloat(getComputedStyle(el).fontSize) }))
          .filter((m) => m.size < 11),
      );
      expect(small).toEqual([]);
    });
  }
});

test.describe("the column fits a tablet, landscape too (no vertical scroll)", () => {
  test.skip(({ hasTouch }) => !hasTouch, "driven from the phone project");
  for (const [width, height] of [
    [1024, 768],
    [1180, 820],
  ] as const) {
    test(`${width}×${height}: the document is no taller than the window, the gap stays 56px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await expect(name(page)).toBeVisible();
      await seekBoot(page, 6000);
      const scroll = await page.evaluate(
        () => document.documentElement.scrollHeight - window.innerHeight,
      );
      expect(scroll, "document is taller than the window by").toBeLessThanOrEqual(0);
      const board = (await column(page).locator("[data-part='board']").boundingBox())!;
      const challenge = (await column(page).getByText(ui.landing.challenge).boundingBox())!;
      expect(Math.abs(challenge.y - (board.y + board.height) - 56)).toBeLessThanOrEqual(2);
      await expectLightsBelowTopRow(page, column(page));
    });
  }
});

/** One part of the column, by its data-part. */
const part = (page: Page, p: string) => column(page).locator(`[data-part='${p}']`);
const look = (page: Page, p: string) =>
  part(page, p)
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return { visibility: s.visibility, opacity: Number(s.opacity) };
    });
const lookAt = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const el = document.querySelector(`[data-landing-column] ${sel}`)!;
    const s = getComputedStyle(el);
    return { visibility: s.visibility, opacity: Number(s.opacity) };
  }, selector);

test.describe("the column plays the boot on Main's beats (D-4)", () => {
  test.skip(({ hasTouch }) => !hasTouch, "driven from the phone project");

  for (const [width, height] of [
    [390, 844],
    [768, 1024],
  ] as const) {
    test.describe(`${width}×${height}`, () => {
      test.use({ viewport: { width, height } });

      test("the top row is there from the first frame; the scene and the board start dark", async ({
        page,
      }) => {
        await page.goto("/");
        await waitForHydration(page);
        await seekBoot(page, 0);
        for (const sel of ["[data-part='top'] > *", "[data-part='top'] button"]) {
          expect(await lookAt(page, sel), sel).toEqual({ visibility: "visible", opacity: 1 });
        }
        for (const p of ["sky", "crowd", "venue"]) expect((await look(page, p)).opacity, p).toBe(0);
        for (const p of ["bank-1", "bank-2", "board-header", "board-footer", "actions", "scan"])
          expect((await look(page, p)).visibility, p).toBe("hidden");
        expect((await lookAt(page, "h1")).opacity).toBe(0);
      });

      test("at 0.5 s the name and the calls to action are not shown (and cannot take focus), the sky and crowd are not up", async ({
        page,
      }) => {
        await page.goto("/");
        await waitForHydration(page);
        await seekBoot(page, 350);
        // The crowd's turn is .3 s: it has barely begun.
        for (const p of ["sky", "crowd", "venue"])
          expect((await look(page, p)).opacity, p).toBeLessThan(0.1);
        await seekBoot(page, 500);
        // The name is not interactive: it stays in the page (readable) and only fades in.
        expect((await lookAt(page, "h1")).opacity).toBe(0);
        expect((await look(page, "actions")).visibility).toBe("hidden");
        // (Not getByRole: a hidden link is out of the accessibility tree, which is the point.)
        for (const href of ["/intro", "/scout"])
          expect(await lookAt(page, `a[href='${href}']`)).toMatchObject({ visibility: "hidden" });
        for (const p of ["bank-1", "bank-2"])
          expect((await look(page, p)).visibility, `${p} before its turn`).toBe("hidden");
        const stops = await tabStops(page, 6);
        expect(stops.join(" | ")).toContain(ui.audio.labelPhone);
        expect(stops.join(" | ")).not.toContain(ui.landing.enter);
        expect(stops.join(" | ")).not.toContain(ui.landing.view);
      });

      test("the banks flicker on left then right (.6 s, 1.1 s); sky, glow and the board follow on their beats", async ({
        page,
      }) => {
        await page.goto("/");
        await waitForHydration(page);
        await seekBoot(page, 1000);
        expect((await look(page, "bank-1")).visibility).toBe("visible");
        expect((await look(page, "bank-2")).visibility).toBe("hidden");
        await seekBoot(page, 1500);
        expect((await look(page, "bank-2")).visibility).toBe("visible");
        await seekBoot(page, 2000);
        expect((await look(page, "sky")).opacity).toBe(0); // 2.2 s
        await seekBoot(page, 2300);
        expect((await look(page, "sky")).opacity).toBeGreaterThan(0);
        expect((await look(page, "venue")).opacity).toBe(0); // 2.4 s
        await seekBoot(page, 2500);
        expect((await look(page, "venue")).opacity).toBeGreaterThan(0);
        expect((await look(page, "board-header")).visibility).toBe("hidden"); // 2.7 s
        await seekBoot(page, 3200); // header and scan (2.7), name (3.0) have begun
        expect((await look(page, "board-header")).visibility).toBe("visible");
        expect((await look(page, "scan")).visibility).toBe("visible");
        expect((await lookAt(page, "h1")).opacity).toBeGreaterThan(0);
        expect((await look(page, "board-footer")).visibility).toBe("hidden"); // 4.0 s
        expect((await look(page, "actions")).visibility).toBe("hidden"); // 4.5 s
      });

      test("at the end everything is shown and both calls to action take Tab", async ({ page }) => {
        await page.goto("/");
        await waitForHydration(page);
        await seekBoot(page, 6000);
        for (const p of ["sky", "crowd", "venue", "bank-1", "bank-2", "board-header"])
          expect(await look(page, p), p).toEqual({ visibility: "visible", opacity: 1 });
        for (const p of ["board-footer", "actions"])
          expect(await look(page, p), p).toEqual({ visibility: "visible", opacity: 1 });
        expect((await lookAt(page, "h1")).opacity).toBe(1);
        const stops = await tabStops(page, 6);
        expect(stops.join(" | ")).toContain(ui.landing.enter);
        expect(stops.join(" | ")).toContain(ui.landing.view);
      });

      test("a return visit plays the cut-down: the calls to action are in by 1.6 s", async ({
        page,
      }) => {
        await page.addInitScript(() => localStorage.setItem("arena:landing-seen", "1"));
        await page.goto("/");
        await expect(page.locator("html")).toHaveAttribute("data-return-visit", "");
        const end = await part(page, "actions").evaluate((group) =>
          Math.max(
            ...group.getAnimations().map((a) => Number(a.effect!.getComputedTiming().endTime)),
          ),
        );
        expect(end).toBeLessThanOrEqual(1600);
        await seekBoot(page, 1600);
        await enter(page).focus();
        await expect(enter(page)).toBeFocused();
        await expect(quick(page)).toBeVisible();
      });

      test("coming back in the same session plays the cut-down too", async ({ page }) => {
        // The page's timers run on a clock the test steps: the 5.2 s beat that marks the boot as played
        // fires at once, with no wait. (The CSS animations ignore it.)
        await page.clock.install();
        await page.goto("/");
        await waitForHydration(page);
        await page.clock.fastForward(6000);
        await page.clock.resume();
        await seekBoot(page, 6000);
        await quick(page).click();
        await expect(page).toHaveURL("/scout");
        await page.goBack();
        await expect(page).toHaveURL("/");
        await expect(page.locator("html")).toHaveAttribute("data-return-visit", "");
        const end = await part(page, "actions").evaluate((group) =>
          Math.max(
            ...group.getAnimations().map((a) => Number(a.effect!.getComputedTiming().endTime)),
          ),
        );
        expect(end).toBeLessThanOrEqual(1600);
      });

      test.describe("reduced motion", () => {
        test.use({ reducedMotion: "reduce" });
        test("everything is shown at once", async ({ page }) => {
          await page.goto("/");
          await waitForHydration(page);
          await page.waitForTimeout(100);
          for (const p of ["sky", "crowd", "venue", "bank-1", "bank-2", "board-header"])
            expect(await look(page, p), p).toEqual({ visibility: "visible", opacity: 1 });
          for (const p of ["board-footer", "actions"])
            expect(await look(page, p), p).toEqual({ visibility: "visible", opacity: 1 });
          expect((await lookAt(page, "h1")).opacity).toBe(1);
          await expect(enter(page)).toBeVisible();
          await expect(quick(page)).toBeVisible();
        });
      });
    });
  }

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    test("the CSS boot still ends with the column in place", async ({ page }) => {
      await page.goto("/");
      await expect(enter(page)).toBeVisible({ timeout: 10_000 });
      await expect(quick(page)).toBeVisible();
      await expect(name(page)).toBeVisible();
    });
  });
});

test.describe("every viewport below the stage (Review Focus 5)", () => {
  test.skip(({ hasTouch }) => !hasTouch, "driven from the phone project");

  for (const [width, height] of [
    [1199, 800],
    [1024, 768],
    [768, 1024],
    [390, 844],
    [375, 667],
    [360, 640],
  ] as const) {
    test(`${width}×${height}: nothing clipped, one h1, mono at 11px or more`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await expect(name(page)).toBeVisible();
      await expectNoHorizontalOverflow(page, [width], height);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

      // Short phones scroll: each call to action is brought into view and sits fully inside the document.
      for (const cta of [enter(page), quick(page)]) {
        await cta.scrollIntoViewIfNeeded();
        const inside = await cta.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const doc = document.documentElement;
          return {
            left: r.left >= 0,
            right: r.right <= doc.scrollWidth,
            bottom: r.bottom + window.scrollY <= doc.scrollHeight,
          };
        });
        expect(inside).toEqual({ left: true, right: true, bottom: true });
      }

      const small = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('[class*="type-mono"]')]
          .filter((el) => el.getClientRects().length > 0)
          .map((el) => ({ text: el.textContent, size: parseFloat(getComputedStyle(el).fontSize) }))
          .filter((m) => m.size < 11),
      );
      expect(small).toEqual([]);
    });
  }
});
