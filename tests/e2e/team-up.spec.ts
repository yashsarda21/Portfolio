import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ui } from "../../src/content/ui-copy";
import { ROUTES } from "../../src/shell/routes";
import { expectMatchesArtboard } from "../support/visual";
import {
  commentaryBar,
  expectMainLandmarks,
  expectNoHorizontalOverflow,
  expectTabBarClear,
  waitForHydration,
} from "./support/contentPage";

// The e2e runner loads plain TS (no JSON imports), so read the contact details from disk.
const content = JSON.parse(
  readFileSync(join(process.cwd(), "src/content/content.json"), "utf8"),
) as { player: { contact: { email: string } } };
const EMAIL = content.player.contact.email;
const t = ui.pages.teamUp;
const NAME = "Sam Visitor";
const VISITOR_EMAIL = "sam@example.com";
const MESSAGE = "We are hiring a full-stack engineer.";

const nameField = (page: Page) => page.getByLabel(t.fields.name, { exact: true });
const emailField = (page: Page) => page.getByLabel(t.fields.email, { exact: true });
const messageField = (page: Page) => page.getByLabel(t.fields.message, { exact: true });
const sendButton = (page: Page) => page.getByRole("button", { name: t.send });
const success = (page: Page) =>
  page.getByRole("heading", { level: 2, name: t.success.title, exact: true });

/** The honeypot is out of the accessibility tree on purpose, so it is found by its name (Formspree's). */
const honeypot = (page: Page) => page.locator('input[name="_gotcha"]');

/**
 * This build has no form service, so the one way to the "received" state in a real browser is a quiet drop:
 * a filled honeypot reads as sent. (The service path is covered by unit tests with a faked network.)
 */
async function sendQuietly(page: Page) {
  await fillIn(page);
  await honeypot(page).fill("http://spam.example", { force: true });
  await sendButton(page).click();
}

async function fillIn(page: Page) {
  await nameField(page).fill(NAME);
  await emailField(page).fill(VISITOR_EMAIL);
  await messageField(page).fill(MESSAGE);
}

/** The page's `window.open` stands in for the mail app: every URL it is asked to open is kept. */
async function captureOpenedUrls(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __opened: string[] }).__opened = [];
    window.open = (url) => {
      (window as unknown as { __opened: string[] }).__opened.push(String(url));
      return null;
    };
  });
}
const opened = (page: Page) =>
  page.evaluate(() => (window as unknown as { __opened: string[] }).__opened);

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the title, the form and the channels are in the HTML; the form posts as an email", async ({
    page,
  }) => {
    await page.goto(ROUTES.teamUp);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("TEAM UP");
    const form = page.locator("form");
    await expect(form).toHaveAttribute("action", new RegExp(`^mailto:${EMAIL}`));
    await expect(form).toHaveAttribute("method", "post");
    await expect(form).toHaveAttribute("enctype", "text/plain");
    // The browser's own checks apply while scripts have not run.
    await expect(form).not.toHaveAttribute("novalidate");
    await expect(nameField(page)).toHaveAttribute("required", "");
    await expect(page.getByRole("radio")).toHaveCount(3);
    for (const { title } of [t.formats.sign, t.formats.doubles, t.formats.rally])
      await expect(page.getByRole("radio", { name: title })).toBeAttached();
    const lines = page.getByRole("region", { name: t.skip });
    await expect(lines.getByRole("link")).toHaveCount(4);
    await expect(sendButton(page)).toBeVisible();
  });
});

test.describe("page", () => {
  test("keeps one main landmark with the one h1; TEAM UP is the way in, with no REMATCH and no commentary", async ({
    page,
  }) => {
    await page.goto(ROUTES.teamUp);
    await expectMainLandmarks(page);
    await expect(page.getByRole("link", { name: ui.hud.rematch })).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: ui.pages.breadcrumb }).locator("[aria-current='page']"),
    ).toHaveText(ui.routes.teamUp.heading);
    await waitForHydration(page);
    // No line on air: the only commentary bar is the AFTER YOU SEND preview, which is part of the page.
    await expect(commentaryBar(page)).toHaveCount(1);
    await expect(
      page.getByRole("group", { name: t.after.label }).locator("[data-commentary-bar]"),
    ).toHaveCount(1);
  });

  test("the form is a group of three formats and the labelled fields; the channels are plain same-tab links", async ({
    page,
  }) => {
    await page.goto(ROUTES.teamUp);
    const group = page.getByRole("group", { name: t.formats.legend });
    await expect(group.getByRole("radio")).toHaveCount(3);
    await expect(group.getByRole("radio", { name: t.formats.sign.title })).toBeChecked();
    for (const label of [t.fields.name, t.fields.email, t.fields.message])
      await expect(page.getByLabel(label, { exact: true })).toBeVisible();
    const lines = page.getByRole("region", { name: t.skip });
    const links = await lines.getByRole("link").evaluateAll((els) =>
      els.map((el) => ({
        href: el.getAttribute("href"),
        target: el.getAttribute("target"),
        arrowHidden: el.querySelector("[aria-hidden='true']:not(svg)")?.textContent,
      })),
    );
    expect(links.map((l) => l.href)).toEqual([
      `mailto:${EMAIL}`,
      expect.stringContaining("linkedin.com/in/"),
      expect.stringContaining("github.com/"),
      expect.stringContaining("leetcode.com/"),
    ]);
    for (const link of links) {
      expect(link.target).toBeNull();
      expect(link.arrowHidden).toBe(ui.glyph.external);
    }
    await expect(page.getByText(t.after.label)).toBeVisible();
  });
});

test.describe("checking the form", () => {
  test("sending it empty shows three errors, each linked to its field, and the cursor goes to the first", async ({
    page,
  }) => {
    await captureOpenedUrls(page);
    await page.goto(ROUTES.teamUp);
    await waitForHydration(page);
    await sendButton(page).click();

    const expected = [
      [nameField(page), t.errors.name],
      [emailField(page), t.errors.email],
      [messageField(page), t.errors.message],
    ] as const;
    for (const [field, text] of expected) {
      await expect(field).toHaveAttribute("aria-invalid", "true");
      const error = page.getByText(text, { exact: true });
      await expect(error).toBeVisible();
      const id = await error.getAttribute("id");
      expect(id).toBeTruthy();
      await expect(field).toHaveAttribute("aria-describedby", new RegExp(`(^| )${id}( |$)`));
    }
    await expect(nameField(page)).toBeFocused();
    expect(await opened(page)).toEqual([]);
  });

  test("the cursor goes to the next field that needs fixing, and a fixed field loses its error as you type", async ({
    page,
  }) => {
    await page.goto(ROUTES.teamUp);
    await waitForHydration(page);
    await nameField(page).fill(NAME);
    await sendButton(page).click();
    await expect(emailField(page)).toBeFocused();
    await expect(page.getByText(t.errors.name)).toHaveCount(0);

    await emailField(page).fill("sam@example");
    await expect(page.getByText(t.errors.email)).toBeVisible();
    await emailField(page).fill(VISITOR_EMAIL);
    await expect(page.getByText(t.errors.email)).toHaveCount(0);
    await expect(emailField(page)).not.toHaveAttribute("aria-invalid");

    await messageField(page).fill("too short");
    await expect(page.getByText(t.errors.message)).toBeVisible();
    await messageField(page).fill(MESSAGE);
    await expect(page.getByText(t.errors.message)).toHaveCount(0);
  });

  test("the arrow keys move between the formats", async ({ page }) => {
    await page.goto(ROUTES.teamUp);
    await waitForHydration(page);
    const sign = page.getByRole("radio", { name: t.formats.sign.title });
    const doubles = page.getByRole("radio", { name: t.formats.doubles.title });
    const rally = page.getByRole("radio", { name: t.formats.rally.title });
    await sign.focus();
    await page.keyboard.press("ArrowRight");
    await expect(doubles).toBeChecked();
    await expect(doubles).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(rally).toBeChecked();
    await page.keyboard.press("ArrowLeft");
    await expect(doubles).toBeChecked();
  });
});

/** A clipboard the test controls (headless browsers refuse the real one), or none at all. */
async function stubClipboard(page: Page, mode: "works" | "missing") {
  await page.addInitScript((m) => {
    const w = window as unknown as { __copied: string[] };
    w.__copied = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value:
        m === "missing"
          ? undefined
          : { writeText: (t: string) => (w.__copied.push(t), Promise.resolve()) },
    });
  }, mode);
}
const copied = (page: Page) =>
  page.evaluate(() => (window as unknown as { __copied: string[] }).__copied);

test.describe("sending by email (no form service)", () => {
  test("opens the mail app pre-filled, then says nothing is sent yet and keeps every word", async ({
    page,
  }) => {
    await captureOpenedUrls(page);
    await page.goto(ROUTES.teamUp);
    await waitForHydration(page);
    await page.getByRole("radio", { name: t.formats.doubles.title }).check();
    await fillIn(page);
    await sendButton(page).click();

    const urls = await opened(page);
    expect(urls).toHaveLength(1);
    expect(urls[0]!.startsWith(`mailto:${EMAIL}?subject=`)).toBe(true);
    const params = new URL(urls[0]!).searchParams;
    expect(params.get("subject")).toBe(`${t.formats.doubles.title} — ${NAME}`);
    expect(params.get("body")).toContain(MESSAGE);
    expect(params.get("body")).toContain(VISITOR_EMAIL);

    // Not a success: the visitor still has to press send in their mail app.
    const note = page.getByRole("status").filter({ hasText: t.mailto.note });
    await expect(note).toBeVisible();
    await expect(success(page)).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: t.after.comm })).toHaveCount(0);
    await expect(page.locator(".animate-floodlight-pulse")).toHaveCount(0);
    await expect(nameField(page)).toHaveValue(NAME);
    await expect(emailField(page)).toHaveValue(VISITOR_EMAIL);
    await expect(messageField(page)).toHaveValue(MESSAGE);
    await expect(page.getByRole("radio", { name: t.formats.doubles.title })).toBeChecked();
    await expect(
      page.getByRole("link", { name: `${t.orEmail} ${EMAIL}`, exact: false }),
    ).toBeVisible();
  });

  test("COPY MESSAGE puts the message on the clipboard and says so", async ({ page }) => {
    await captureOpenedUrls(page);
    await stubClipboard(page, "works");
    await page.goto(ROUTES.teamUp);
    await waitForHydration(page);
    await fillIn(page);
    await sendButton(page).click();
    await page.getByRole("button", { name: t.mailto.copy }).click();
    await expect(page.getByRole("button", { name: t.mailto.copied })).toBeVisible();
    const [text] = await copied(page);
    expect(text).toContain(MESSAGE);
    expect(text).toContain(VISITOR_EMAIL);
    // The row goes back to COPY MESSAGE after a moment.
    await expect(page.getByRole("button", { name: t.mailto.copy })).toBeVisible();
  });

  test("with no clipboard the message is shown in a field, selected, for copying by hand", async ({
    page,
  }) => {
    await captureOpenedUrls(page);
    await stubClipboard(page, "missing");
    await page.goto(ROUTES.teamUp);
    await waitForHydration(page);
    await fillIn(page);
    await sendButton(page).click();
    await page.getByRole("button", { name: t.mailto.copy }).click();
    const field = page.getByRole("textbox", { name: t.mailto.copy });
    await expect(field).toBeFocused();
    await expect(field).toHaveValue(new RegExp(MESSAGE));
    expect(
      await field.evaluate((el: HTMLTextAreaElement) => el.selectionEnd - el.selectionStart),
    ).toBe(await field.evaluate((el: HTMLTextAreaElement) => el.value.length));
  });

  test("two submits in the same moment open one email, not two", async ({ page }) => {
    await captureOpenedUrls(page);
    await page.goto(ROUTES.teamUp);
    await waitForHydration(page);
    await fillIn(page);
    // Both land before the page has drawn anything: the second must find the first still in flight.
    await page.locator("form").evaluate((form: HTMLFormElement) => {
      form.requestSubmit();
      form.requestSubmit();
    });
    await expect(page.getByText(t.mailto.note)).toBeVisible();
    expect(await opened(page)).toHaveLength(1);
  });
});

test.describe("a challenge that is received", () => {
  test("the heading has the cursor and the line is announced; nothing is opened", async ({
    page,
  }) => {
    await captureOpenedUrls(page);
    await page.goto(ROUTES.teamUp);
    await waitForHydration(page);
    await sendQuietly(page);

    await expect(success(page)).toBeFocused();
    await expect(page.locator("form")).toHaveCount(0);
    expect(await opened(page)).toEqual([]);
    // A screen reader hears the line from the page's status; the bar itself is a picture of it.
    await expect(page.getByRole("status").filter({ hasText: t.after.comm })).toHaveCount(1);
    await expect(page.getByText(t.success.board.fixture, { exact: true })).toBeVisible();
    await expect(page.getByText(t.success.board.visitor, { exact: true })).toBeVisible();
  });

  test("SEND ANOTHER brings back an empty form with the cursor in the name", async ({ page }) => {
    await page.goto(ROUTES.teamUp);
    await waitForHydration(page);
    await sendQuietly(page);
    await expect(success(page)).toBeFocused();
    await page.getByRole("button", { name: t.success.again }).click();
    await expect(nameField(page)).toBeFocused();
    await expect(nameField(page)).toHaveValue("");
    await expect(emailField(page)).toHaveValue("");
    await expect(messageField(page)).toHaveValue("");
    await expect(page.getByRole("radio", { name: t.formats.sign.title })).toBeChecked();
    await expect(page.getByRole("status").filter({ hasText: t.after.comm })).toHaveCount(0);
  });

  test("the floodlights pulse once; with reduced motion nothing animates", async ({ page }) => {
    await page.goto(ROUTES.teamUp);
    await waitForHydration(page);
    await expect(page.locator(".animate-floodlight-pulse")).toHaveCount(0);
    await sendQuietly(page);
    const pulse = page.locator(".animate-floodlight-pulse");
    await expect(pulse).toHaveCount(1);
    await expect(pulse).toHaveCSS("animation-name", "floodlight-pulse");
    await expect(pulse).toHaveCSS("animation-iteration-count", "1");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(pulse).toHaveCSS("animation-name", "none");
    await expect(pulse).toHaveCSS("opacity", "0");
  });
});

test.describe("desktop", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 768, "desktop layout");

  test("matches the Team-Up artboard", async ({ page }) => {
    await page.goto(ROUTES.teamUp);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await waitForHydration(page);
    // No mask: the page draws the same words as the board, and has no commentary on arrival.
    const ratio = await expectMatchesArtboard(page, "Team-Up", { maxDiffRatio: 0.02 });
    expect(ratio).toBeLessThanOrEqual(0.02);
  });

  test("never scrolls sideways", async ({ page }) => {
    await page.goto(ROUTES.teamUp);
    await expectNoHorizontalOverflow(page, [768, 1024, 1200, 1440]);
  });

  test("never scrolls sideways with errors showing and after sending", async ({ page }) => {
    await captureOpenedUrls(page);
    await page.goto(ROUTES.teamUp);
    await waitForHydration(page);
    await sendButton(page).click();
    await expect(page.getByText(t.errors.name)).toBeVisible();
    await expectNoHorizontalOverflow(page, [768, 1024, 1200, 1440]);
    await fillIn(page);
    await sendButton(page).click();
    await expect(page.getByText(t.mailto.note)).toBeVisible();
    await expectNoHorizontalOverflow(page, [768, 1024, 1200, 1440]);
    await page.reload();
    await waitForHydration(page);
    await sendQuietly(page);
    await expect(success(page)).toBeVisible();
    await expectNoHorizontalOverflow(page, [768, 1024, 1200, 1440]);
  });

  test("on a tablet the form takes the width and the direct lines run below it, two to a row", async ({
    page,
  }) => {
    await page.goto(ROUTES.teamUp);
    await page.setViewportSize({ width: 1024, height: 1000 });
    const box = async (locator: ReturnType<Page["locator"]>) => (await locator.boundingBox())!;
    const form = await box(page.locator("form"));
    const lines = page.getByRole("region", { name: t.skip });
    const cards = lines.getByRole("link");
    const [a, b, c] = [await box(cards.nth(0)), await box(cards.nth(1)), await box(cards.nth(2))];
    expect(a.y).toBeGreaterThanOrEqual(form.y + form.height);
    expect(b.y).toBe(a.y);
    expect(b.x).toBeGreaterThan(a.x + a.width - 1);
    expect(c.y).toBeGreaterThan(a.y);
    expect(form.width).toBeGreaterThan(900);
  });

  test("at 1440 the direct lines sit to the right of the form, level with the panels", async ({
    page,
  }) => {
    await page.goto(ROUTES.teamUp);
    const form = (await page.locator("form").boundingBox())!;
    const first = (await page.getByRole("region", { name: t.skip }).boundingBox())!;
    expect(first.x).toBeGreaterThanOrEqual(form.x + form.width);
    expect(Math.round(first.x)).toBe(860);
    expect(Math.round(first.y)).toBe(236);
  });
});

test.describe("phone", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, "phone layout");

  test("never scrolls sideways, with errors showing and after sending", async ({ page }) => {
    await captureOpenedUrls(page);
    await page.goto(ROUTES.teamUp);
    await waitForHydration(page);
    await expectNoHorizontalOverflow(page, [360, 390], 844);
    await sendButton(page).click();
    await expect(page.getByText(t.errors.name)).toBeVisible();
    await expectNoHorizontalOverflow(page, [360, 390], 844);
    await fillIn(page);
    await sendButton(page).click();
    await expect(page.getByText(t.mailto.note)).toBeVisible();
    await expectNoHorizontalOverflow(page, [360, 390], 844);
    await page.reload();
    await waitForHydration(page);
    await sendQuietly(page);
    await expect(success(page)).toBeVisible();
    await expectNoHorizontalOverflow(page, [360, 390], 844);
  });

  test("reads title, form, then the direct lines, one column", async ({ page }) => {
    await page.goto(ROUTES.teamUp);
    await page.setViewportSize({ width: 360, height: 844 });
    const y = async (locator: ReturnType<Page["locator"]>) => (await locator.boundingBox())!.y;
    const x = async (locator: ReturnType<Page["locator"]>) => (await locator.boundingBox())!.x;
    const order = [
      await y(page.getByRole("heading", { level: 1 })),
      await y(page.getByRole("group", { name: t.formats.legend })),
      await y(sendButton(page)),
      await y(page.getByRole("region", { name: t.skip })),
    ];
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    // The formats stack, the name and email stack.
    const doubles = page.getByRole("radio", { name: t.formats.doubles.title });
    const sign = page.getByRole("radio", { name: t.formats.sign.title });
    expect(await x(doubles)).toBe(await x(sign));
    expect(await y(emailField(page))).toBeGreaterThan(await y(nameField(page)));
    // The send button is the full width.
    const send = (await sendButton(page).boundingBox())!;
    expect(send.width).toBeGreaterThanOrEqual(360 - 32 - 1);
  });

  test("marks TEAM UP as the current tab, and the last control clears the bar", async ({
    page,
  }) => {
    await page.goto(ROUTES.teamUp);
    const tabs = page.getByRole("navigation", { name: ui.tabs.label });
    await expect(tabs).toBeVisible();
    await expect(tabs.locator("[aria-current]")).toHaveCount(1);
    await expect(tabs.getByRole("link", { name: ui.tabs.teamUp })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expectTabBarClear(page);
  });
});
