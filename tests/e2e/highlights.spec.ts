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
  player: { contact: { github: string } };
  matchHighlights: {
    round: string;
    name: string;
    serve: string;
    rally: string;
    winner: string;
  }[];
};
const highlights = content.matchHighlights;
const final = highlights.find((h) => h.round === "THE FINAL")!;
const semi = highlights.find((h) => h.round === "SEMI-FINAL")!;

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("every project and its serve, rally and winner text are in the HTML", async ({ page }) => {
    await page.goto(ROUTES.highlights);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.highlights.heading, {
      ignoreCase: true,
    });
    expect(highlights).toHaveLength(3);
    for (const h of highlights) {
      // Role queries skip hidden elements; the unselected panels are in the HTML but hidden.
      await expect(page.locator("h2").filter({ hasText: h.name })).toBeAttached();
      for (const text of [h.serve, h.rally, h.winner]) {
        await expect(page.getByText(text, { exact: true })).toBeAttached();
      }
    }
  });

  test("the final is the panel on show", async ({ page }) => {
    await page.goto(ROUTES.highlights);
    await expect(page.getByRole("heading", { level: 2, name: final.name })).toBeVisible();
    await expect(page.getByText(final.winner, { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: semi.name })).toBeHidden();
  });
});

test.describe("the draw", () => {
  test("arrow keys move between rounds, the panel follows and the commentary answers", async ({
    page,
  }) => {
    await page.goto(ROUTES.highlights);
    // Keys pressed before React has taken over the prerendered page do nothing.
    await waitForHydration(page);
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");

    await tabs.nth(2).focus();
    await page.keyboard.press("ArrowUp");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "false");
    await expect(page.getByRole("tabpanel")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 2, name: "KUDO BOARD" })).toBeVisible();
    await expect(page.getByText(semi.winner, { exact: true })).toBeVisible();
    await expect(page.getByText(final.winner, { exact: true })).toBeHidden();
    await expect(page.locator("[aria-live=polite]").filter({ hasText: /\S/ })).toHaveText(
      "Another project shipped.",
    );

    // Back to the final: its own line.
    await page.keyboard.press("ArrowDown");
    await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("[aria-live=polite]").filter({ hasText: /\S/ })).toHaveText(
      ui.pages.highlights.commFinal,
    );
  });

  test("keeps one main landmark with the one h1", async ({ page }) => {
    await page.goto(ROUTES.highlights);
    await expectMainLandmarks(page);
  });

  test("REMATCH and NEXT VENUE lead where they say", async ({ page }) => {
    await page.goto(ROUTES.highlights);
    // REMATCH is hidden on the phone (the tab bar and header carry navigation there).
    if ((page.viewportSize()?.width ?? 0) >= 768) {
      await expect(page.getByRole("link", { name: ui.hud.rematch })).toHaveAttribute(
        "href",
        ROUTES.tennis,
      );
    }
    await expect(page.getByRole("link", { name: new RegExp(ui.hud.nextVenue) })).toHaveAttribute(
      "href",
      ROUTES.badminton,
    );
  });
});

test.describe("links", () => {
  test("CODE ON GITHUB goes to the GitHub profile in the same tab, and no link on the page is a bare #", async ({
    page,
  }) => {
    await page.goto(ROUTES.highlights);
    const code = page.getByRole("link", { name: new RegExp(ui.pages.highlights.code) });
    // One per project (the unselected panels are hidden), so only the visible one is exposed.
    await expect(code).toHaveCount(1);
    await expect(code).toHaveAttribute("href", content.player.contact.github);
    // Links stay in the same tab, as drawn; only a document (the resume PDF) opens a new one.
    await expect(code).not.toHaveAttribute("target");

    // The content has no demo or case-study links, so neither row is drawn (and nothing links to "#").
    await expect(page.getByRole("link", { name: ui.pages.highlights.demo })).toHaveCount(0);
    await expect(page.getByRole("link", { name: ui.pages.highlights.caseStudy })).toHaveCount(0);
    expect(await page.locator('a[href="#"]').count()).toBe(0);
  });
});

test.describe("desktop", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 768, "desktop layout");

  test("matches the Tennis-Highlights artboard", async ({ page }) => {
    await page.goto(ROUTES.highlights);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await commentaryBar(page).waitFor();
    const ratio = await expectMatchesArtboard(page, "Tennis-Highlights", {
      maxDiffRatio: 0.02,
      mask: [
        // The COMM line animates in and out, so its box is not stable.
        commentaryBar(page),
        // P1 (plan, spec §11): the placeholder says "REPLAY COMING SOON", the artboard "ADD A 10s SCREEN RECORDING".
        page.getByRole("tabpanel").locator("p").first(),
        // Content wording: the final's kind line reads "Published research · PICT", the artboard "Published research".
        page
          .getByRole("tab", { name: new RegExp(final.name, "i") })
          .locator("span")
          .last(),
      ],
      maskRects: [
        // P2 (plan, spec §11): the content has no demo or case-study links, so the real page draws only the
        // CODE ON GITHUB row (pinned to the bottom); the artboard draws three rows here.
        { x: 1120, y: 605, width: 268, height: 170 },
      ],
    });
    expect(ratio).toBeLessThanOrEqual(0.02);
  });

  test("never scrolls sideways", async ({ page }) => {
    await page.goto(ROUTES.highlights);
    await expectNoHorizontalOverflow(page, [768, 1024, 1200, 1440]);
  });

  test("keeps the next-venue label on one line", async ({ page }) => {
    await page.goto(ROUTES.highlights);
    await expectNextButtonOneLine(page, new RegExp(ui.hud.nextVenue), [768, 1024, 1440]);
  });

  test("the draw keeps its place and the panels stay beside it at 1200 and up", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(ROUTES.highlights);
    const [draw, replay, shot] = await Promise.all([
      page.getByRole("tablist").boundingBox(),
      page.getByRole("tabpanel").getByRole("heading", { level: 2 }).boundingBox(),
      page.getByRole("heading", { level: 3, name: ui.pages.highlights.shotData }).boundingBox(),
    ]);
    expect(replay!.x).toBeGreaterThan(draw!.x + draw!.width);
    expect(shot!.x).toBeGreaterThan(replay!.x + replay!.width);
  });
});

test.describe("phone", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, "phone layout");

  test("never scrolls sideways", async ({ page }) => {
    await page.goto(ROUTES.highlights);
    await expectNoHorizontalOverflow(page, [360, 390], 844);
  });

  test("keeps the next-venue label on one line", async ({ page }) => {
    await page.goto(ROUTES.highlights);
    await expectNextButtonOneLine(page, new RegExp(ui.hud.nextVenue), [360, 390], 844);
  });

  test("shows the tab bar with PROJECTS current, and the last control clears it", async ({
    page,
  }) => {
    await page.goto(ROUTES.highlights);
    const tabs = page.getByRole("navigation", { name: ui.tabs.label });
    await expect(tabs).toBeVisible();
    await expect(tabs.getByRole("link", { name: ui.tabs.projects })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expectTabBarClear(page);
  });
});
