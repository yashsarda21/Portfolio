import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ui } from "../../src/content/ui-copy";
import { ROUTES } from "../../src/shell/routes";
import { expectMatchesArtboard } from "../support/visual";
import {
  expectMainLandmarks,
  expectNextButtonOneLine,
  expectNoHorizontalOverflow,
  expectTabBarClear,
  waitForHydration,
} from "./support/contentPage";

// The e2e runner loads plain TS (no JSON imports), so read the resume content from disk.
const content = JSON.parse(
  readFileSync(join(process.cwd(), "src/content/content.json"), "utf8"),
) as {
  trophyRoom: { type: string; title: string; description: string }[];
  trainingAcademy: { school: string };
};
const WON = content.trophyRoom.filter((t) => t.type !== "locked");
const NEXT = new RegExp(ui.pages.trophies.next);
const HINT = ui.pages.trophies.lockedHint;
const ACADEMY = { level: 2, name: ui.scout.academy.title } as const;
/** The heading the `#academy` link must bring into view. */
const academyHeading = (page: Page) => page.getByRole("heading", ACADEMY);

/** Tabs by their accessible name (the title, then the shelf line). */
const tab = (page: Page, name: RegExp | string) => page.getByRole("tab", { name });
const HEADER_BOTTOM = 76;

/**
 * A viewport short enough that the academy heading starts below the fold, so landing on it proves the page
 * scrolled. The desktop board is 1440 wide; the phone keeps its own 390x844.
 */
async function shortViewport(page: Page) {
  const width = page.viewportSize()?.width ?? 1440;
  await page.setViewportSize(
    width >= 768 ? { width: 1440, height: 500 } : { width: 390, height: 844 },
  );
}

/** The academy heading is on screen, under the header, after the page scrolled to it. */
async function expectAcademyLanded(page: Page) {
  const heading = academyHeading(page);
  await expect(heading).toBeInViewport();
  await expect
    .poll(async () => (await heading.boundingBox())?.y ?? -1, {
      message: "the heading sits below the header",
    })
    .toBeGreaterThanOrEqual(HEADER_BOTTOM);
  expect(await page.evaluate(() => window.scrollY), "the page scrolled to it").toBeGreaterThan(0);
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the heading, every description, the locked trophy and the academy are in the HTML", async ({
    page,
  }) => {
    await page.goto(ROUTES.trophies);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.trophies.heading, {
      ignoreCase: true,
    });
    expect(WON).toHaveLength(5);
    for (const t of WON)
      await expect(page.getByText(t.description, { exact: true })).toBeAttached();
    // The locked trophy is on the shelf (disabled, announced with its hint) and has no description.
    await expect(tab(page, `Giant Killer, ${HINT}`)).toBeDisabled();
    await expect(page.getByRole("tab")).toHaveCount(6);
    await expect(academyHeading(page)).toBeVisible();
    await expect(page.locator("#academy")).toHaveCount(1);
    await expect(
      page.getByText(content.trainingAcademy.school.replace(/ \(PICT\)$/, "")),
    ).toBeVisible();
  });
});

test.describe("trophy cabinet", () => {
  test("arrow keys select the next trophy and the panel follows; End skips the locked one", async ({
    page,
  }) => {
    await page.goto(ROUTES.trophies);
    // Keys pressed before React has taken over the prerendered page do nothing.
    await waitForHydration(page);
    const tabs = page.getByRole("tab");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText("750+ Problems Solved");

    await tabs.first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    const panel = page.getByRole("tabpanel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("99.5 Percentile");
    await expect(panel).toContainText("2 / 5");
    await expect(page.getByText(WON[0]!.description, { exact: true })).toBeHidden();

    await page.keyboard.press("End");
    await expect(tab(page, /System Design Blogs/i)).toHaveAttribute("aria-selected", "true");
    await expect(tab(page, /System Design Blogs/i)).toBeFocused();
    await expect(page.getByRole("tabpanel")).toContainText("5 / 5");
    await expect(tab(page, `Giant Killer, ${HINT}`)).toHaveAttribute("aria-selected", "false");
  });

  test("the locked trophy cannot be selected by click", async ({ page }) => {
    await page.goto(ROUTES.trophies);
    await waitForHydration(page);
    const locked = tab(page, `Giant Killer, ${HINT}`);
    await locked.click({ force: true });
    await expect(locked).toHaveAttribute("aria-selected", "false");
    await expect(page.getByRole("tab").first()).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText("750+ Problems Solved");
  });

  test("clicking a trophy selects it", async ({ page }) => {
    await page.goto(ROUTES.trophies);
    await waitForHydration(page);
    await tab(page, /Published Research/i).click();
    await expect(page.getByRole("tabpanel")).toContainText("3 / 5");
    await expect(page.getByRole("tabpanel")).toContainText(WON[2]!.description);
  });

  test("plinth links open in the same tab", async ({ page }) => {
    await page.goto(ROUTES.trophies);
    const links = page.getByRole("tabpanel").getByRole("link");
    await expect(links).toHaveCount(3);
    for (const link of await links.all()) await expect(link).not.toHaveAttribute("target");
  });

  test("keeps one main landmark with the one h1", async ({ page }) => {
    await page.goto(ROUTES.trophies);
    await expectMainLandmarks(page);
  });

  test("the way on is the player card; there is no REMATCH", async ({ page }) => {
    await page.goto(ROUTES.trophies);
    await expect(page.getByRole("link", { name: NEXT })).toHaveAttribute("href", ROUTES.card);
    await expect(page.getByRole("link", { name: ui.hud.rematch })).toHaveCount(0);
  });
});

test.describe("the academy hash", () => {
  test("a cold load of /trophies#academy lands on the academy heading", async ({ page }) => {
    await shortViewport(page);
    await page.goto(`${ROUTES.trophies}#academy`);
    await waitForHydration(page);
    await expectAcademyLanded(page);
  });

  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`from the career scorecard, the trophy room link lands on the academy heading (${reducedMotion} motion)`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion });
      await shortViewport(page);
      await page.goto(ROUTES.career);
      await waitForHydration(page);
      await page.getByRole("tab", { name: /ACADEMY/i }).click();
      await page.getByRole("link", { name: new RegExp(ui.pages.career.academyLink) }).click();
      await expect(page).toHaveURL(new RegExp(`${ROUTES.trophies}#academy$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.trophies.heading, {
        ignoreCase: true,
      });
      await expectAcademyLanded(page);
    });
  }
});

test.describe("motion", () => {
  test("only the selected trophy turns, and the turntable follows the selection", async ({
    page,
  }) => {
    await page.goto(ROUTES.trophies);
    await waitForHydration(page);
    const turning = () =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("[role=tab]")].map((el) =>
          [...el.querySelectorAll<HTMLElement>("[data-kind] > span")].some(
            (figure) => getComputedStyle(figure).animationName === "turntable",
          ),
        ),
      );
    expect(await turning()).toEqual([true, false, false, false, false, false]);
    await tab(page, /99\.5 Percentile/i).click();
    expect(await turning()).toEqual([false, true, false, false, false, false]);
  });

  test("with reduced motion nothing turns and the spotlight is simply lit", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(ROUTES.trophies);
    await waitForHydration(page);
    const selected = tab(page, /750\+ Problems Solved/i);
    await expect(selected).toHaveAttribute("aria-selected", "true");
    const figure = selected.locator("[data-kind] > span").first();
    await expect(figure).toHaveCSS("animation-name", "none");
    const spot = selected.locator(".scene-spot");
    await expect(spot).toHaveCSS("animation-name", "none");
    await expect(spot).toHaveCSS("opacity", "1");
    // Every spotlight on the shelf is lit, and no trophy turns.
    for (const light of await page.locator(".scene-spot").all()) {
      await expect(light).toHaveCSS("animation-name", "none");
      await expect(light).toHaveCSS("opacity", "1");
    }
    await expect(page.locator("[data-kind] > span").first()).toHaveCSS("animation-name", "none");
  });
});

test.describe("gold", () => {
  /** Elements whose text, border or background is the trophy gold, and whether each sits in the zone. */
  async function goldElements(page: Page) {
    return page.evaluate(() => {
      const probe = document.createElement("span");
      document.body.append(probe);
      const resolve = (value: string) => {
        probe.style.color = value;
        return getComputedStyle(probe).color;
      };
      const gold = resolve("#d4b26a");
      probe.remove();
      return [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((el) => {
          const s = getComputedStyle(el);
          return s.color === gold || s.borderTopColor === gold || s.backgroundColor === gold;
        })
        .map((el) => ({ tag: el.tagName, inZone: !!el.closest('[data-zone="trophy"]') }));
    });
  }

  test("gold shows on the trophy room, and only inside the trophy zone", async ({ page }) => {
    await page.goto(ROUTES.trophies);
    const found = await goldElements(page);
    expect(
      found.length,
      "the eyebrow, the plinth label and the lit shelf line are gold",
    ).toBeGreaterThan(2);
    expect(found.every((el) => el.inZone)).toBe(true);
  });

  for (const route of [ROUTES.career, ROUTES.attributes, ROUTES.highlights]) {
    test(`no gold on ${route}`, async ({ page }) => {
      await page.goto(route);
      expect(await goldElements(page)).toEqual([]);
    });
  }
});

test.describe("desktop", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 768, "desktop layout");

  test("matches the Trophy-Room artboard", async ({ page }) => {
    await page.goto(ROUTES.trophies);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const ratio = await expectMatchesArtboard(page, "Trophy-Room", {
      maxDiffRatio: 0.02,
      // T1 (plan, spec 11): the real page adds the PLAYER CARD button, so the footer takes 110px and the cabinet
      // and academy end 74px higher than drawn; the academy's meta line also carries ", SPPU" and wraps.
      // Compared in full: the header, the title, the first shelf and the plinth panel. Masked (in artboard
      // pixels, painted onto both images): shelf 2, the academy below its title, and the footer strip. The
      // artboard-copy story compares the whole board.
      maskRects: [
        { x: 36, y: 558, width: 872, height: 306 },
        { x: 930, y: 600, width: 474, height: 264 },
        { x: 0, y: 790, width: 1440, height: 110 },
      ],
    });
    expect(ratio).toBeLessThanOrEqual(0.02);
  });

  test("never scrolls sideways", async ({ page }) => {
    await page.goto(ROUTES.trophies);
    await expectNoHorizontalOverflow(page, [768, 1024, 1200, 1440]);
  });

  test("keeps the next label on one line", async ({ page }) => {
    await page.goto(ROUTES.trophies);
    await expectNextButtonOneLine(page, NEXT, [768, 1024, 1440]);
  });
});

test.describe("phone", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, "phone layout");

  test("never scrolls sideways", async ({ page }) => {
    await page.goto(ROUTES.trophies);
    await expectNoHorizontalOverflow(page, [360, 390], 844);
  });

  test("keeps the next label on one line", async ({ page }) => {
    await page.goto(ROUTES.trophies);
    await expectNextButtonOneLine(page, NEXT, [360, 390], 844);
  });

  test("shows the tab bar with no tab current, and the last control clears it", async ({
    page,
  }) => {
    await page.goto(ROUTES.trophies);
    const tabs = page.getByRole("navigation", { name: ui.tabs.label });
    await expect(tabs).toBeVisible();
    await expect(tabs.locator("[aria-current]")).toHaveCount(0);
    await expectTabBarClear(page);
  });
});
