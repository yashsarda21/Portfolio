import { expect, test, type Locator, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { waitForFiniteAnimations } from "../support/animations";
import { waitForHydration } from "./support/contentPage";
import { VIEWPORTS, expectMonoFloor } from "./support/game";

const ft = ui.fullTime;
const PATH = "/arena/full-time";
/** A touch target is at least this tall (A5). */
const TARGET = 44;

/** Writes a saved match record (the persist shape, version 2) before the page's own scripts run. */
async function seed(page: Page, venuesPlayed: string[], form = 0) {
  await page.addInitScript(
    ({ venuesPlayed, form }) => {
      localStorage.setItem(
        "arena:v1",
        JSON.stringify({
          state: {
            venuesPlayed,
            lastScores: {},
            bestForm: Object.fromEntries(venuesPlayed.map((v) => [v, form])),
            sectionsSeen: [],
            yashWins: venuesPlayed.length,
          },
          version: 2,
        }),
      );
    },
    { venuesPlayed, form },
  );
}
const ALL = ["cricket", "tennis", "badminton"];

/** What of `locator` is on screen: the stage and the column hold the same words, and CSS shows one. */
const shown = (locator: Locator) => locator.filter({ visible: true });

/** The page's h1 that is on screen (the stage's or the column's: CSS shows one). */
const headline = (page: Page) => page.getByRole("heading", { level: 1 });
const board = (page: Page) => page.getByRole("img", { name: new RegExp(`^${ft.board}`) });

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

test("no record: NOT YET., 0 of 3 played, the card sends you to cricket", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto(PATH);
  await waitForHydration(page);
  await expect(headline(page)).toHaveText(ft.pending.headline);
  await expect(shown(page.getByText(`0 ${ft.pending.of} 3 ${ft.pending.played}`))).toBeVisible();
  await expect(shown(page.getByText("MATCHDAY IN PROGRESS · 0 OF 3 VENUES"))).toBeVisible();
  await expect(board(page)).toHaveAttribute("aria-label", "Final score: You 0, Yash 0");
  await expect(shown(page.getByText(ui.venues.cricket, { exact: true }))).toBeVisible();
  await expect(page.getByRole("link", { name: ft.next.cta })).toHaveAttribute(
    "href",
    "/arena/cricket",
  );
  await expect(page.getByRole("link", { name: ui.games.backToHub })).toHaveAttribute(
    "href",
    "/arena",
  );
  expect(errors).toEqual([]);
});

test("two venues played: still NOT YET., and the next venue is named", async ({ page }) => {
  await seed(page, ["cricket", "tennis"]);
  await page.goto(PATH);
  await waitForHydration(page);
  await expect(headline(page)).toHaveText(ft.pending.headline);
  await expect(shown(page.getByText("MATCHDAY IN PROGRESS · 2 OF 3 VENUES"))).toBeVisible();
  await expect(shown(page.getByText(ui.venues.badminton, { exact: true }))).toBeVisible();
  await expect(page.getByRole("link", { name: ft.next.cta })).toHaveAttribute(
    "href",
    "/arena/badminton",
  );
});

test("all three played: the grade, YOU 0 · 3 YASH, Team Up and PLAY AGAIN", async ({ page }) => {
  await seed(page, ALL, 1 / 3);
  await page.goto(PATH);
  await waitForHydration(page);
  await expect(headline(page)).toHaveText(ft.grades.niceEffort.headline);
  await expect(shown(page.getByText(ft.grades.niceEffort.line))).toBeVisible();
  await expect(board(page)).toHaveAttribute("aria-label", "Final score: You 0, Yash 3");
  await expect(shown(page.getByText("MATCHDAY COMPLETE · 3 OF 3 VENUES"))).toBeVisible();
  await expect(page.getByRole("link", { name: ft.teamUp.cta })).toHaveAttribute("href", "/team-up");
  await expect(page.getByRole("link", { name: ft.again })).toHaveAttribute(
    "href",
    "/arena/cricket",
  );
  await expect(page.getByRole("link", { name: ft.card })).toHaveAttribute("href", "/card");
  await expect(page.getByText(ft.pending.headline)).toHaveCount(0);
});

test("a returning visitor with three venues never sees NOT YET. (H5)", async ({ page }) => {
  await seed(page, ALL, 1 / 3);
  // Every frame from the first script on: is the word on screen? (innerText leaves out what is hidden.)
  await page.addInitScript((words) => {
    const seen = { notYet: false, frames: 0 };
    (window as unknown as { __seen: typeof seen }).__seen = seen;
    const tick = () => {
      seen.frames++;
      if (document.body?.innerText.includes(words)) seen.notYet = true;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, ft.pending.headline);
  const sample = () => page.locator("h1:visible", { hasText: ft.pending.headline }).count();

  await page.goto(PATH, { waitUntil: "commit" });
  expect(await sample().catch(() => 0)).toBe(0);
  await page.waitForLoadState("domcontentloaded");
  expect(await sample()).toBe(0);
  await expect(headline(page)).toHaveText(ft.grades.niceEffort.headline);
  expect(await sample()).toBe(0);
  await page.waitForTimeout(300);
  const seen = await page.evaluate(
    () => (window as unknown as { __seen: { notYet: boolean; frames: number } }).__seen,
  );
  expect(seen.frames, "the probe ran").toBeGreaterThan(5);
  expect(seen.notYet, "NOT YET. was on screen at some frame").toBe(false);
});

test("blocked storage: NOT YET. renders without an error", async ({ page }) => {
  const errors = watchErrors(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });
  await page.goto(PATH);
  await waitForHydration(page);
  await expect(headline(page)).toHaveText(ft.pending.headline);
  await expect(page.getByRole("link", { name: ui.games.backToHub })).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("NOT YET. and BACK TO THE HUB is a working link", async ({ page }) => {
    await page.goto(PATH);
    await expect(headline(page)).toHaveText(ft.pending.headline);
    // The links rise in until 2.8 s; a click on a part still moving waits for it to settle.
    await waitForFiniteAnimations(page);
    const back = page.getByRole("link", { name: ui.games.backToHub });
    await expect(back).toHaveAttribute("href", "/arena");
    await back.click();
    await expect(page).toHaveURL(/\/arena$/);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the headline is there at once, not risen in", async ({ page }) => {
    await seed(page, ALL, 1 / 3);
    await page.goto(PATH);
    await waitForHydration(page);
    await expect(headline(page)).toHaveText(ft.grades.niceEffort.headline);
    // Straight after it is there: its own and its ancestors' opacity multiply to 1 and nothing is offset.
    const risen = await headline(page).evaluate((el) => {
      let opacity = 1;
      let offset = 0;
      for (let n: Element | null = el; n && !n.hasAttribute("data-stage"); n = n.parentElement) {
        const style = getComputedStyle(n);
        opacity *= Number(style.opacity);
        offset += Math.abs(new DOMMatrix(style.transform).m42);
      }
      return { opacity, offset };
    });
    expect(risen).toEqual({ opacity: 1, offset: 0 });
  });
});

test("every width and height of Review Focus 5 (done, then early)", async ({ page }) => {
  test.setTimeout(120_000);
  await seed(page, ALL, 1 / 3);
  await page.goto(PATH);
  await waitForHydration(page);
  await expect(headline(page)).toHaveText(ft.grades.niceEffort.headline);
  // The card and the links rise in until 2.8 s; a part not yet arrived is hidden.
  await waitForFiniteAnimations(page);

  const hold = async (what: string) => {
    const view = page.viewportSize()!;
    const at = `${what} at ${view.width}x${view.height}`;
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${at}: horizontal overflow (px)`).toBeLessThanOrEqual(0);
    await expect(headline(page), `${at}: rendered h1s`).toHaveCount(1);
    await expectMonoFloor(page);
    // The board sits inside the window.
    const box = (await board(page).boundingBox())!;
    expect(box.x, `${at}: the board's left edge`).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, `${at}: the board's right edge`).toBeLessThanOrEqual(view.width);
    // Every link is at least 44px tall (on the stage: in the 1440×900 design space, which scales to the window).
    const heights = await page.locator("main a:visible").evaluateAll((links) =>
      links.map((a) => ({
        name: a.textContent?.trim(),
        height: a.closest("[data-stage]")
          ? (a as HTMLElement).offsetHeight
          : a.getBoundingClientRect().height,
      })),
    );
    expect(heights.length, `${at}: links`).toBeGreaterThan(0);
    for (const link of heights)
      expect(link.height, `${at}: ${link.name}`).toBeGreaterThanOrEqual(TARGET);
  };

  for (const [width, height] of VIEWPORTS) {
    await page.setViewportSize({ width, height });
    // A layout that CSS has just shown plays its entrance from the start.
    await waitForFiniteAnimations(page);
    await hold("done");
  }
});

test("early, at every width and height", async ({ page }) => {
  test.setTimeout(120_000);
  await seed(page, ["tennis"]);
  await page.goto(PATH);
  await waitForHydration(page);
  await expect(headline(page)).toHaveText(ft.pending.headline);
  await waitForFiniteAnimations(page);
  for (const [width, height] of VIEWPORTS) {
    await page.setViewportSize({ width, height });
    const view = page.viewportSize()!;
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow at ${width}x${height}`).toBeLessThanOrEqual(0);
    await expect(headline(page), `rendered h1s at ${width}x${height}`).toHaveCount(1);
    await expectMonoFloor(page);
    const box = (await board(page).boundingBox())!;
    expect(box.x + box.width, `the board's right edge at ${width}x${height}`).toBeLessThanOrEqual(
      view.width,
    );
  }
});
