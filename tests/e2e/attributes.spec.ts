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
} from "./support/contentPage";

// The e2e runner loads plain TS (no JSON imports), so read the resume content from disk.
const content = JSON.parse(
  readFileSync(join(process.cwd(), "src/content/content.json"), "utf8"),
) as {
  player: { name: string };
  playerAttributes: { groups: { name: string; skills: [string, string, string?][] }[] };
};
const { groups } = content.playerAttributes;
const SKILLS = groups.flatMap((g) => g.skills.map(([name]) => name));
const NEXT = new RegExp(ui.pages.attributes.next);

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the heading, all 16 skills, the 4 groups and the portrait are in the HTML", async ({
    page,
  }) => {
    await page.goto(ROUTES.attributes);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.attributes.heading, {
      ignoreCase: true,
    });
    for (const group of groups) {
      await expect(page.getByRole("heading", { level: 2, name: group.name })).toBeVisible();
    }
    expect(SKILLS).toHaveLength(16);
    for (const name of SKILLS) await expect(page.getByText(name, { exact: true })).toBeAttached();
    await expect(page.getByRole("img", { name: content.player.name })).toBeVisible();
    await expect(page.getByRole("img", { name: content.player.name })).toHaveAttribute(
      "alt",
      "Yash Sarda",
    );
  });

  test("every group lists its skills as a list", async ({ page }) => {
    await page.goto(ROUTES.attributes);
    for (const group of groups) {
      const section = page.getByRole("region", { name: group.name });
      await expect(section.getByRole("listitem")).toHaveCount(group.skills.length);
    }
  });
});

test.describe("page", () => {
  test("keeps one main landmark with the one h1", async ({ page }) => {
    await page.goto(ROUTES.attributes);
    await expectMainLandmarks(page);
  });

  test("REMATCH and the way on lead where they say", async ({ page }) => {
    await page.goto(ROUTES.attributes);
    // REMATCH is hidden on the phone (the tab bar and header carry navigation there).
    if ((page.viewportSize()?.width ?? 0) >= 768) {
      await expect(page.getByRole("link", { name: ui.hud.rematch })).toHaveAttribute(
        "href",
        ROUTES.badminton,
      );
    }
    await expect(page.getByRole("link", { name: NEXT })).toHaveAttribute("href", ROUTES.trophies);
  });
});

test.describe("desktop", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 768, "desktop layout");

  test("matches the Badminton-Attributes artboard", async ({ page }) => {
    await page.goto(ROUTES.attributes);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await commentaryBar(page).waitFor();
    // The portrait is a lighten-blended image: wait for it to decode before comparing.
    await page
      .getByRole("img", { name: content.player.name })
      .evaluate((img: HTMLImageElement) => img.decode());
    const ratio = await expectMatchesArtboard(page, "Badminton-Attributes", {
      maxDiffRatio: 0.02,
      // The COMM line animates in and out, so its box is not stable. No other mask: the real copy is
      // the artboard's copy (the segment bars are fast-forwarded by the compare).
      mask: [commentaryBar(page)],
    });
    expect(ratio).toBeLessThanOrEqual(0.02);
  });

  test("never scrolls sideways", async ({ page }) => {
    await page.goto(ROUTES.attributes);
    await expectNoHorizontalOverflow(page, [768, 1024, 1200, 1440]);
  });

  test("keeps the next label on one line", async ({ page }) => {
    await page.goto(ROUTES.attributes);
    await expectNextButtonOneLine(page, NEXT, [768, 1024, 1440]);
  });
});

test.describe("phone", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, "phone layout");

  test("never scrolls sideways", async ({ page }) => {
    await page.goto(ROUTES.attributes);
    await expectNoHorizontalOverflow(page, [360, 390], 844);
  });

  test("keeps the next label on one line", async ({ page }) => {
    await page.goto(ROUTES.attributes);
    await expectNextButtonOneLine(page, NEXT, [360, 390], 844);
  });

  test("shows the tab bar with SKILLS current, and the last control clears it", async ({
    page,
  }) => {
    await page.goto(ROUTES.attributes);
    const tabs = page.getByRole("navigation", { name: ui.tabs.label });
    await expect(tabs).toBeVisible();
    await expect(tabs.getByRole("link", { name: ui.tabs.skills })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expectTabBarClear(page);
  });
});
