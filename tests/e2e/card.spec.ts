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
  player: {
    name: string;
    cardStats: { label: string; value: string }[];
    contact: { email: string };
  };
};
const t = ui.pages.card;
const NEXT = new RegExp(t.next);
/** The way on, in main (the phone's tab bar has a TEAM UP link of its own). */
const nextLink = (page: Page) => page.locator("main#main").getByRole("link", { name: NEXT });
/** The year the Player-Card artboard draws on the card. */
const ARTBOARD_YEAR = 2026;

const front = (page: Page) => page.locator('[data-face="front"]');
const back = (page: Page) => page.locator('[data-face="back"]');
/** The card's flip button: its name says where it flips to. Only the face that shows is exposed. */
const flipButton = (page: Page, name: string) => page.getByRole("button", { name });
/** The back's index rows. By tag, not by role: while the front shows, the back is aria-hidden and inert, so it has no links in the role tree. */
const backLinks = (page: Page) => back(page).locator("ul a");

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the title, the card, the stats and the resume request are in the HTML; no PDF is linked", async ({
    page,
  }) => {
    await page.goto(ROUTES.card);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("PLAYER PROFILE");
    await expect(front(page).getByText(content.player.name, { exact: true })).toBeAttached();
    expect(content.player.cardStats).toHaveLength(6);
    for (const { label } of content.player.cardStats)
      await expect(front(page).getByText(label, { exact: true })).toBeAttached();
    const request = page.getByRole("link", { name: new RegExp(t.request.title) });
    await expect(request).toHaveAttribute("href", /^mailto:/);
    await expect(page.locator("a[href*='.pdf' i]")).toHaveCount(0);
    // The way on and the back's index are plain links too.
    await expect(nextLink(page)).toHaveAttribute("href", ROUTES.teamUp);
    await expect(backLinks(page)).toHaveCount(5);
  });
});

test.describe("page", () => {
  test("keeps one main landmark with the one h1", async ({ page }) => {
    await page.goto(ROUTES.card);
    await expectMainLandmarks(page);
  });

  test("the way on is TEAM UP; there is no REMATCH; the breadcrumb ends at PLAYER CARD", async ({
    page,
  }) => {
    await page.goto(ROUTES.card);
    await expect(nextLink(page)).toHaveAttribute("href", ROUTES.teamUp);
    await expect(page.getByRole("link", { name: ui.hud.rematch })).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: ui.pages.breadcrumb }).locator("[aria-current='page']"),
    ).toHaveText(ui.routes.card.heading);
  });

  test("while there is no public PDF the volt row is the email request, and the copy row follows", async ({
    page,
  }) => {
    await page.goto(ROUTES.card);
    const section = page.getByRole("region", { name: t.take });
    const rows = section.getByRole("link");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(t.request.title);
    await expect(rows.first()).not.toHaveAttribute("target");
    await expect(section.getByRole("button", { name: new RegExp(t.copy.title) })).toBeVisible();
    await expect(page.getByText(t.download.title)).toHaveCount(0);
  });

  test("the season shows the year, the visitor's own once the page has loaded", async ({
    page,
  }) => {
    await page.goto(ROUTES.card);
    await waitForHydration(page);
    await expect(front(page)).toContainText(`${t.season} ${new Date().getFullYear()}`);
  });
});

test.describe("flipping", () => {
  test("Enter flips to the back, whose links are reachable by Tab while the front's are not; Space flips back", async ({
    page,
  }) => {
    await page.goto(ROUTES.card);
    await waitForHydration(page);
    const toBack = flipButton(page, t.flipToBack);
    await expect(back(page)).toHaveAttribute("inert", "");
    await toBack.focus();
    await page.keyboard.press("Enter");

    // The front is inert now, and focus stayed on the card: its button on the back face.
    const toFront = flipButton(page, t.flipToFront);
    await expect(toFront).toBeFocused();
    await expect(front(page)).toHaveAttribute("inert", "");
    await expect(back(page)).not.toHaveAttribute("inert");

    // Tab walks the five index links, all on the back.
    const reached: (string | null)[] = [];
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      reached.push(
        await page.evaluate(
          () => document.activeElement?.closest("[data-face]")?.getAttribute("data-face") ?? null,
        ),
      );
    }
    expect(reached).toEqual(["back", "back", "back", "back", "back"]);
    expect(await backLinks(page).count()).toBe(5);

    await toFront.focus();
    await page.keyboard.press("Space");
    await expect(toBack).toBeFocused();
    await expect(back(page)).toHaveAttribute("inert", "");
    await expect(front(page)).not.toHaveAttribute("inert");
  });

  test("the back also says how to reach the player: the address, as a mail link", async ({
    page,
  }) => {
    await page.goto(ROUTES.card);
    await waitForHydration(page);
    await flipButton(page, t.flipToBack).click({ force: true });
    const mail = back(page).getByRole("link", { name: content.player.contact.email });
    await expect(mail).toBeVisible();
    await expect(mail).toHaveAttribute("href", `mailto:${content.player.contact.email}`);
    await expect(
      back(page).getByText(ui.pages.teamUp.channels.email, { exact: true }),
    ).toBeVisible();
  });

  test("a click flips it too, and a link on the back goes where it says without flipping", async ({
    page,
  }) => {
    await page.goto(ROUTES.card);
    await waitForHydration(page);
    // Forced: the card floats, so it is never "stable" for the click's own check. A visitor clicks it anyway.
    await flipButton(page, t.flipToBack).click({ force: true });
    await expect(flipButton(page, t.flipToFront)).toBeVisible();
    const hrefs = await backLinks(page).evaluateAll((links) =>
      links.map((l) => l.getAttribute("href")),
    );
    expect(hrefs).toEqual([
      ROUTES.career,
      ROUTES.highlights,
      ROUTES.attributes,
      ROUTES.trophies,
      ROUTES.teamUp,
    ]);
  });

  test("with reduced motion the card stands still, and a flip still swaps the faces", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(ROUTES.card);
    await waitForHydration(page);
    const card = page.locator("[data-player-card]");
    await expect(card.locator(".animate-card-float")).toHaveCSS("animation-name", "none");
    await expect(card.locator(".animate-sheen").first()).toHaveCSS("animation-name", "none");
    await expect(card.locator(".animate-card-float")).toHaveCSS("transform", "none");

    await expect(backLinks(page).first()).toBeHidden();
    await flipButton(page, t.flipToBack).click();
    await expect(flipButton(page, t.flipToFront)).toBeVisible();
    await expect(backLinks(page).first()).toBeVisible();
    await expect(front(page).getByText(content.player.name, { exact: true })).toBeHidden();
  });
});

test.describe("copy link", () => {
  const copyRow = (page: Page) => page.getByRole("button", { name: new RegExp(t.copy.title) });

  test("copies the scouting link, says so on screen and to screen readers, then settles back", async ({
    page,
    context,
    baseURL,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseURL! });
    await page.goto(ROUTES.card);
    await waitForHydration(page);
    await copyRow(page).click();

    await expect(page.getByText(t.copy.done)).toBeVisible();
    // A polite status outside the button carries the words screen readers hear.
    const status = page.getByRole("status").filter({ hasText: ui.a11y.copied });
    await expect(status).toHaveCount(1);
    await expect(status).toHaveText(ui.a11y.copied);
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe(`${new URL(page.url()).origin}${ROUTES.scout}`);
    expect(copied.endsWith("/scout")).toBe(true);

    await expect(page.getByText(t.copy.done)).toBeHidden({ timeout: 5000 });
    await expect(page.getByText(t.copy.sub)).toBeVisible();
  });

  test("when the clipboard refuses, the link shows in a field, selected, to copy by hand", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: () => Promise.reject(new DOMException("denied", "NotAllowedError")) },
        configurable: true,
      });
    });
    await page.goto(ROUTES.card);
    await waitForHydration(page);
    await copyRow(page).click();

    const field = page.getByRole("textbox", { name: t.copy.fallback });
    await expect(field).toBeVisible();
    await expect(field).toHaveAttribute("readonly", "");
    await expect(field).toHaveValue(`${new URL(page.url()).origin}${ROUTES.scout}`);
    await expect(field).toBeFocused();
    const selected = await field.evaluate((el: HTMLInputElement) =>
      el.value.slice(el.selectionStart ?? 0, el.selectionEnd ?? 0),
    );
    expect(selected).toBe(await field.inputValue());
    // The focus move to the labelled field is the message: the status stays quiet (no double announcement).
    await expect(page.getByRole("status").filter({ hasText: /\S/ })).toHaveCount(0);
    await expect(page.getByText(t.copy.done)).toHaveCount(0);
  });

  test("with no clipboard at all it falls back the same way", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    });
    await page.goto(ROUTES.card);
    await waitForHydration(page);
    await copyRow(page).click();
    await expect(page.getByRole("textbox", { name: t.copy.fallback })).toBeVisible();
  });
});

test.describe("desktop", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 768, "desktop layout");

  test("matches the Player-Card artboard", async ({ page }) => {
    await page.goto(ROUTES.card);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await waitForHydration(page);
    await page
      .getByRole("img", { name: content.player.name })
      .evaluate((img: HTMLImageElement) => img.decode());
    const ratio = await expectMatchesArtboard(page, "Player-Card", {
      maxDiffRatio: 0.02,
      maskRects: [
        // COMM: the line animates in and out (4s on air), so its box is not stable. A fixed area, not the
        // element: it may already be gone when the compare looks for it.
        { x: 24, y: 812, width: 392, height: 60 },
        // C1: with no public PDF the real page shows the email request and the copy row only, so the actions
        // column differs from the artboard's three rows, and its note below the rows rises to meet them.
        { x: 984, y: 262, width: 420, height: 404 },
        // SEASON {year}: the card shows the visitor's year, the artboard 2026. Only masked once they differ.
        ...(new Date().getFullYear() === ARTBOARD_YEAR
          ? []
          : [{ x: 790, y: 180, width: 125, height: 24 }]),
      ],
    });
    expect(ratio).toBeLessThanOrEqual(0.02);
  });

  test("never scrolls sideways", async ({ page }) => {
    await page.goto(ROUTES.card);
    await expectNoHorizontalOverflow(page, [768, 1024, 1200, 1440]);
  });

  test("keeps the next label on one line", async ({ page }) => {
    await page.goto(ROUTES.card);
    await expectNextButtonOneLine(page, NEXT, [768, 1024, 1440]);
  });

  test("on a tablet the card sits beside the profile and the actions run below both", async ({
    page,
  }) => {
    await page.goto(ROUTES.card);
    await page.setViewportSize({ width: 1024, height: 1000 });
    const box = async (locator: ReturnType<Page["locator"]>) => (await locator.boundingBox())!;
    const card = await box(page.locator("[data-player-card]"));
    const bio = await box(page.getByText(/hands-on full-stack/));
    const actions = await box(page.getByRole("region", { name: t.take }));
    expect(bio.x + bio.width).toBeLessThanOrEqual(card.x);
    expect(actions.y).toBeGreaterThanOrEqual(card.y + card.height);
  });
});

test.describe("phone", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, "phone layout");

  test("never scrolls sideways", async ({ page }) => {
    await page.goto(ROUTES.card);
    await expectNoHorizontalOverflow(page, [360, 390], 844);
  });

  test("keeps the next label on one line", async ({ page }) => {
    await page.goto(ROUTES.card);
    await expectNextButtonOneLine(page, NEXT, [360, 390], 844);
  });

  test("reads title, card, actions, then the profile; the whole card is on screen at 360", async ({
    page,
  }) => {
    await page.goto(ROUTES.card);
    await page.setViewportSize({ width: 360, height: 844 });
    const y = async (locator: ReturnType<Page["locator"]>) => (await locator.boundingBox())!.y;
    const card = page.locator("[data-player-card]");
    const box = (await card.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(360);
    const order = [
      await y(page.getByRole("heading", { level: 1 })),
      await y(card),
      await y(page.getByRole("region", { name: t.take })),
      await y(page.getByText(/hands-on full-stack/)),
    ];
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  test("the card is fluid, keeps its proportions, and holds its text at full size without zoom", async ({
    page,
  }) => {
    await page.goto(ROUTES.card);
    await waitForHydration(page);
    const card = page.locator("[data-player-card]");
    for (const width of [320, 360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      const box = (await card.boundingBox())!;
      // As wide as the 16px gutters allow (never wider than drawn), and 402:642 tall.
      expect(Math.abs(box.width - Math.min(402, width - 32))).toBeLessThanOrEqual(1);
      expect(Math.abs(box.height / box.width - 642 / 402)).toBeLessThan(0.02);
      for (const side of ["front", "back"] as const) {
        const face = page.locator(`[data-face="${side}"]`);
        const report = await face.evaluate((el) => {
          const small: string[] = [];
          for (const node of el.querySelectorAll("*")) {
            const own = [...node.childNodes].some(
              (n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim() !== "",
            );
            if (own && parseFloat(getComputedStyle(node).fontSize) < 11)
              small.push(`${node.textContent} ${getComputedStyle(node).fontSize}`);
          }
          // Nothing is clipped by the face's own edge, and no element is zoomed.
          return {
            small,
            clipped: el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1,
            zoom: getComputedStyle(el.closest("[data-player-card]")!).zoom,
          };
        });
        expect(report, `${side} at ${width}`).toEqual({ small: [], clipped: false, zoom: "1" });
      }
    }
  });

  test("the stat cells put the label over the value", async ({ page }) => {
    await page.goto(ROUTES.card);
    await page.setViewportSize({ width: 360, height: 844 });
    const [label, value] = await front(page)
      .getByText(content.player.cardStats[0]!.label, { exact: true })
      .evaluate((el) => {
        const cell = el.parentElement!;
        const [l, v] = [...cell.children].map((c) => c.getBoundingClientRect());
        return [l!.bottom, v!.top];
      });
    expect(value!).toBeGreaterThanOrEqual(label! - 1);
  });

  test("shows the tab bar with no tab current, and the last control clears it", async ({
    page,
  }) => {
    await page.goto(ROUTES.card);
    const tabs = page.getByRole("navigation", { name: ui.tabs.label });
    await expect(tabs).toBeVisible();
    await expect(tabs.locator("[aria-current]")).toHaveCount(0);
    await expectTabBarClear(page);
  });
});
