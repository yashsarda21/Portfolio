import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { ROUTES } from "../../src/shell/routes";
import { waitForHydration } from "./support/contentPage";

/*
 * Every prerendered page carries its own Content-Security-Policy <meta> (tools/postbuild.mjs). The browser
 * enforces it, so a page whose inline script is missing from its hashes breaks. This visits every page, uses it,
 * and fails on the first violation the browser reports.
 */

const CSP_META = '<meta http-equiv="Content-Security-Policy"';

type CspWindow = Window & { __csp: string[] };

/** Collects every violation the page reports and every console line that mentions the policy. */
async function watch(page: Page) {
  const messages: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) messages.push(m.text());
  });
  await page.addInitScript(() => {
    (window as unknown as CspWindow).__csp = [];
    window.addEventListener("securitypolicyviolation", (e) => {
      (window as unknown as CspWindow).__csp.push(
        `${e.violatedDirective} blocked ${e.blockedURI || "inline"} (${e.sample.slice(0, 80)})`,
      );
    });
  });
  return messages;
}

const violations = (page: Page) => page.evaluate(() => (window as unknown as CspWindow).__csp);

/** Nothing was blocked, said, or reported; and the policy is still right after the charset at the top of <head>. */
async function expectClean(page: Page, messages: string[], at: string) {
  expect(await violations(page), `${at}: securitypolicyviolation events`).toEqual([]);
  expect(messages, `${at}: console messages`).toEqual([]);
  const [first, second] = await page.evaluate(() =>
    [...document.head.children]
      .slice(0, 2)
      .map((el) => el.getAttribute("http-equiv") ?? el.getAttribute("charset")),
  );
  expect(first, `${at}: the first element of <head> (the charset)`).toBe("utf-8");
  expect(second, `${at}: the second element of <head> (the policy)`).toBe(
    "Content-Security-Policy",
  );
}

/** Where a page opens the mail app: the page's `window.open` is a stand-in, so no real mail app is started. */
async function stubWindowOpen(page: Page) {
  await page.addInitScript(() => {
    window.open = () => null;
  });
}

test("the rule is enforced: an inline script that is not in the page's hashes is blocked", async ({
  page,
}) => {
  const messages = await watch(page);
  await page.goto(ROUTES.card);
  await waitForHydration(page);
  await page.evaluate(() => {
    const script = document.createElement("script");
    script.textContent = "window.__ran = true";
    document.head.append(script);
  });
  await expect.poll(() => violations(page)).toHaveLength(1);
  expect((await violations(page))[0]).toContain("script-src");
  expect(await page.evaluate(() => "__ran" in window)).toBe(false);
  expect(messages.join(" ")).toContain("Content Security Policy");
});

test.describe("every page, as served", () => {
  for (const [name, path] of [
    ["the landing", ROUTES.home],
    ["the intro", ROUTES.intro],
    ["the hub", ROUTES.arena],
    ["cricket", ROUTES.cricket],
    ["tennis", ROUTES.tennis],
    ["badminton", ROUTES.badminton],
    ["full time", ROUTES.fullTime],
    ["team up", ROUTES.teamUp],
    ["scout", ROUTES.scout],
    ["card", ROUTES.card],
    ["trophies", ROUTES.trophies],
    ["career", ROUTES.career],
    ["highlights", ROUTES.highlights],
    ["attributes", ROUTES.attributes],
    ["404", ROUTES.notFound],
  ] as const) {
    test(`${name} (${path}) is sent with the charset first and the policy next in <head>`, async ({
      request,
    }) => {
      const html = await (await request.get(path)).text();
      expect(html).toMatch(
        /<head[^>]*>\s*<meta charSet="utf-8"\/>\s*<meta http-equiv="Content-Security-Policy" content="/,
      );
      // The browser finds the charset only in the first 1024 bytes of the file.
      expect(html.indexOf('charSet="utf-8"')).toBeLessThan(1024 - 20);
      expect(html.split(CSP_META)).toHaveLength(2);
      const policy = /content="([^"]*)"/.exec(html.slice(html.indexOf(CSP_META)))![1]!;
      expect(policy).toContain("default-src 'self'");
      const scriptSrc = policy.split("; ").find((d) => d.startsWith("script-src "))!;
      expect(scriptSrc).not.toContain("unsafe");
    });
  }
});

test.describe("no page breaks its own policy", () => {
  test("the landing, once it has booted", async ({ page }) => {
    const messages = await watch(page);
    await page.goto(ROUTES.home);
    await waitForHydration(page);
    await expect(page.getByRole("link", { name: ui.landing.enter })).toBeVisible();
    await page.waitForTimeout(500);
    await expectClean(page, messages, ROUTES.home);
  });

  test("the intro, and SKIP INTRO to the hub", async ({ page }) => {
    const messages = await watch(page);
    await page.goto(ROUTES.intro);
    await waitForHydration(page);
    const skip = page.getByRole("link", { name: ui.hud.skipIntro });
    await expect(skip).toBeVisible();
    await expectClean(page, messages, ROUTES.intro);
    await skip.click();
    await expect(page).toHaveURL(/\/arena$/);
    await waitForHydration(page);
    await expectClean(page, messages, "after SKIP INTRO");
  });

  test("the hub, with a drag on the cards", async ({ page }) => {
    const messages = await watch(page);
    await page.goto(ROUTES.arena);
    await waitForHydration(page);
    const plate = page.locator("[data-orbit]");
    if (await plate.isVisible()) {
      const box = (await plate.locator("..").boundingBox())!;
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 150, y, { steps: 10 });
      await page.mouse.up();
    }
    await expectClean(page, messages, ROUTES.arena);
  });

  test("cricket, one ball bowled", async ({ page }) => {
    const messages = await watch(page);
    await page.goto(ROUTES.cricket);
    await waitForHydration(page);
    const game = page.locator("[data-game]");
    await expect(game).toHaveAttribute("data-phase", "ready");
    await page.keyboard.press("Space");
    await expect(game).not.toHaveAttribute("data-phase", "ready");
    await expectClean(page, messages, ROUTES.cricket);
  });

  test("tennis, one return picked", async ({ page }) => {
    const messages = await watch(page);
    await page.goto(ROUTES.tennis);
    await waitForHydration(page);
    await expect(page.locator("[data-game]")).toHaveAttribute("data-phase", "ready");
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("[data-game]")).not.toHaveAttribute("data-phase", "ready");
    await expectClean(page, messages, ROUTES.tennis);
  });

  test("badminton, one hold", async ({ page }) => {
    const messages = await watch(page);
    await page.goto(ROUTES.badminton);
    await waitForHydration(page);
    await expect(page.locator("[data-game]")).toHaveAttribute("data-phase", "ready");
    await page.keyboard.down("Space");
    await page.waitForTimeout(300);
    await page.keyboard.up("Space");
    await expectClean(page, messages, ROUTES.badminton);
  });

  test("full time, with a finished matchday", async ({ page }) => {
    const messages = await watch(page);
    await page.addInitScript(() => {
      localStorage.setItem(
        "arena:v1",
        JSON.stringify({
          state: {
            venuesPlayed: ["cricket", "tennis", "badminton"],
            lastScores: {},
            bestForm: { cricket: 0, tennis: 0, badminton: 0 },
            sectionsSeen: [],
            yashWins: 3,
          },
          version: 2,
        }),
      );
    });
    await page.goto(ROUTES.fullTime);
    await waitForHydration(page);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeAttached();
    await page.waitForTimeout(500);
    await expectClean(page, messages, ROUTES.fullTime);
  });

  test("team up, filled in and sent with no form service (the mail app)", async ({ page }) => {
    const messages = await watch(page);
    await stubWindowOpen(page);
    await page.goto(ROUTES.teamUp);
    await waitForHydration(page);
    const t = ui.pages.teamUp;
    await page.getByLabel(t.fields.name, { exact: true }).fill("Sam Visitor");
    await page.getByLabel(t.fields.email, { exact: true }).fill("sam@example.com");
    await page
      .getByLabel(t.fields.message, { exact: true })
      .fill("We are hiring a full-stack engineer.");
    await page.getByRole("button", { name: t.send }).click();
    await expect(page.getByRole("status").filter({ hasText: t.mailto.note })).toBeVisible();
    await expectClean(page, messages, ROUTES.teamUp);
  });

  for (const path of [
    ROUTES.scout,
    ROUTES.card,
    ROUTES.trophies,
    ROUTES.career,
    ROUTES.highlights,
    ROUTES.attributes,
    ROUTES.notFound,
    "/arena/nope",
  ]) {
    test(`${path} loads and hydrates`, async ({ page }) => {
      const messages = await watch(page);
      await page.goto(path);
      await waitForHydration(page);
      await page.waitForTimeout(300);
      await expectClean(page, messages, path);
    });
  }
});
