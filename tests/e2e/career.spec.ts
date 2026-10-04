import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ui } from "../../src/content/ui-copy";
import { ROUTES } from "../../src/shell/routes";
import { expectMatchesArtboard } from "../support/visual";
import {
  commentaryBar,
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
  careerStats: { team: string; role: string; ballByBall: string[] }[];
  trainingAcademy: { school: string; cgpa: string; extras: string[] };
};
const [now, intern] = content.careerStats;
const BALLS = [...now!.ballByBall, ...intern!.ballByBall];
const { school, cgpa, extras } = content.trainingAcademy;
const ACADEMY_TAB = /ACADEMY/i;

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the scorecard and every ball-by-ball line are in the HTML", async ({ page }) => {
    await page.goto(ROUTES.career);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.career.heading, {
      ignoreCase: true,
    });
    const rows = page.getByRole("tab");
    await expect(rows).toHaveCount(3);
    for (const row of content.careerStats) {
      await expect(rows.filter({ hasText: row.role })).toContainText(row.team);
    }
    expect(BALLS).toHaveLength(7);
    for (const line of BALLS) await expect(page.getByText(line, { exact: true })).toBeAttached();
  });

  test("the academy is a third tab whose panel text is in the HTML, with the trophy room link inside it", async ({
    page,
  }) => {
    await page.goto(ROUTES.career);
    await expect(page.getByRole("tab", { name: ACADEMY_TAB })).toBeAttached();
    await expect(page.getByText(school, { exact: true })).toBeAttached();
    await expect(page.getByText(`${ui.scout.cgpa} ${cgpa}`, { exact: true })).toBeAttached();
    for (const line of extras) await expect(page.getByText(line, { exact: true })).toBeAttached();
    // The panels are all in the HTML (the unselected ones hidden); the link lives only in the academy's.
    const panel = page.locator('[role="tabpanel"]', { hasText: school });
    const link = panel.getByRole("link", {
      name: new RegExp(ui.pages.career.academyLink),
      includeHidden: true,
    });
    await expect(link).toHaveAttribute("href", "/trophies#academy");
    await expect(
      page.getByRole("link", {
        name: new RegExp(ui.pages.career.academyLink),
        includeHidden: true,
      }),
    ).toHaveCount(1);
  });
});

test.describe("scorecard", () => {
  test("arrow keys move between innings and the panel follows", async ({ page }) => {
    await page.goto(ROUTES.career);
    // Keys pressed before React has taken over the prerendered page do nothing.
    await waitForHydration(page);
    const tabs = page.getByRole("tab");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText(now!.role);

    await tabs.first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "false");
    await expect(page.getByRole("tabpanel")).toBeVisible();
    await expect(page.getByRole("tabpanel")).toContainText("Graduate Analyst Intern");
    await expect(page.getByText(intern!.ballByBall[0]!, { exact: true })).toBeVisible();
    await expect(page.getByText(now!.ballByBall[0]!, { exact: true })).toBeHidden();
  });

  test("the academy row selects like the others and its panel shows the school", async ({
    page,
  }) => {
    await page.goto(ROUTES.career);
    await waitForHydration(page);
    const tabs = page.getByRole("tab");
    await tabs.first().focus();
    await page.keyboard.press("ArrowDown");
    // Each press moves focus with the selection; wait for it before the next one.
    await expect(tabs.nth(1)).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
    const panel = page.getByRole("tabpanel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(school);
    await expect(panel).toContainText(`${ui.scout.cgpa} ${cgpa}`);
    for (const line of extras) await expect(panel.getByText(line, { exact: true })).toBeVisible();
    await expect(
      panel.getByRole("link", { name: new RegExp(ui.pages.career.academyLink) }),
    ).toHaveAttribute("href", "/trophies#academy");
  });

  test("clicking the academy row selects it instead of leaving the page", async ({ page }) => {
    await page.goto(ROUTES.career);
    await waitForHydration(page);
    await page.getByRole("tab", { name: ACADEMY_TAB }).click();
    await expect(page).toHaveURL(new RegExp(`${ROUTES.career}$`));
    await expect(page.getByRole("tabpanel")).toContainText(school);
  });

  test("keeps one main landmark with the one h1", async ({ page }) => {
    await page.goto(ROUTES.career);
    await expectMainLandmarks(page);
  });

  test("REMATCH, NEXT VENUE and VIEW PLAYER CARD lead where they say", async ({ page }) => {
    await page.goto(ROUTES.career);
    // REMATCH is hidden on the phone (the tab bar and header carry navigation there).
    if ((page.viewportSize()?.width ?? 0) >= 768) {
      await expect(page.getByRole("link", { name: ui.hud.rematch })).toHaveAttribute(
        "href",
        ROUTES.cricket,
      );
    }
    await expect(page.getByRole("link", { name: new RegExp(ui.hud.nextVenue) })).toHaveAttribute(
      "href",
      ROUTES.tennis,
    );
    await expect(
      page.getByRole("link", { name: new RegExp(ui.pages.career.viewCard) }),
    ).toHaveAttribute("href", ROUTES.card);
  });
});

test.describe("desktop", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 768, "desktop layout");

  test("matches the Cricket-Career artboard", async ({ page }) => {
    await page.goto(ROUTES.career);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await commentaryBar(page).waitFor();
    const ratio = await expectMatchesArtboard(page, "Cricket-Career", {
      maxDiffRatio: 0.02,
      mask: [
        // The COMM line animates in and out, so its box is not stable.
        commentaryBar(page),
        // P3 (plan, spec §11): the real page adds the "03 ACADEMY" row the artboard does not draw.
        page.getByRole("tab", { name: ACADEMY_TAB }),
      ],
    });
    expect(ratio).toBeLessThanOrEqual(0.02);
  });

  test("never scrolls sideways", async ({ page }) => {
    await page.goto(ROUTES.career);
    await expectNoHorizontalOverflow(page, [768, 1024, 1200, 1440]);
  });

  test("keeps the next-venue label on one line", async ({ page }) => {
    await page.goto(ROUTES.career);
    await expectNextButtonOneLine(page, new RegExp(ui.hud.nextVenue), [768, 1024, 1440]);
  });
});

test.describe("phone", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, "phone layout");

  test("never scrolls sideways", async ({ page }) => {
    await page.goto(ROUTES.career);
    await expectNoHorizontalOverflow(page, [360, 390], 844);
  });

  test("keeps the next-venue label on one line", async ({ page }) => {
    await page.goto(ROUTES.career);
    await expectNextButtonOneLine(page, new RegExp(ui.hud.nextVenue), [360, 390], 844);
  });

  test("shows the tab bar with CAREER current, and the last control clears it", async ({
    page,
  }) => {
    await page.goto(ROUTES.career);
    const tabs = page.getByRole("navigation", { name: ui.tabs.label });
    await expect(tabs).toBeVisible();
    await expect(tabs.getByRole("link", { name: ui.tabs.career })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expectTabBarClear(page);
  });
});
