import { expect, type Page } from "@playwright/test";
import { ui } from "../../../src/content/ui-copy";
import { SPOTLIGHT_MS } from "../../../src/features/games/engine/spotlight";
import { waitForHydration } from "./contentPage";

/**
 * Shared helpers for the three game specs (cricket, tennis, badminton).
 *
 * How Playwright's fake clock behaves (@playwright/test 1.63, checked against its types and by running it):
 *  - `page.clock.install({ time })` replaces Date, setTimeout / setInterval, requestAnimationFrame, requestIdleCallback
 *    and performance in every page and frame, including documents loaded later. Time starts at `time` and then
 *    KEEPS FLOWING in real time, so the page loads normally. Nothing is frozen by install alone.
 *  - `page.clock.pauseAt(t)` jumps forward to `t` (firing each due timer at most once) and stops time. It throws
 *    "Cannot fast-forward to the past" for any `t` before the page's current fake time: there is no "pause right here".
 *  - Once paused, time moves only by `runFor(ms)` (runs every timer and animation frame due on the way, in order,
 *    16 or so ms apart for requestAnimationFrame) or `fastForward(ms)` (jumps, firing each due timer at most once).
 *  - The game's meter and the judge both read performance.now(), which the fake clock owns, so a paused page has a still meter.
 */

/** Where fake time starts (2026-01-01T00:00:00Z, a number so the time zone cannot matter). */
export const CLOCK_START = 1_767_225_600_000;

/** Every Math.random() in the page returns `value` (it pins the draws that are left: tennis' open side and toss, and the dust canvas). Call before `goto`. */
export const forceLuck = (page: Page, value: number) =>
  page.addInitScript((v) => {
    Math.random = () => v;
  }, value);

/**
 * Installs the fake clock at CLOCK_START. Call it BEFORE `goto`: the clock must exist when the page's scripts start.
 * Time keeps flowing until `pauseClock`, so the page loads and hydrates as usual.
 */
export async function freezeClock(page: Page) {
  await page.clock.install({ time: CLOCK_START });
}

/**
 * Stops time at the page's current fake time plus a small gap. `pauseAt` can only go forward, and fake time
 * keeps flowing while this call travels to the page, so it asks for 250 ms ahead and, if that has already
 * passed, for twice as much (up to four tries). Time jumps by that gap once, firing each due timer at most once, so
 * the game's own clock reads a few hundred ms more than it did a moment before: a test that needs a ball at
 * exactly 0 starts a fresh one after pausing. Call it after the page has loaded (after `waitForHydration`).
 */
export async function pauseClock(page: Page) {
  let gap = 250;
  for (let attempt = 0; ; attempt++) {
    const now = await page.evaluate(() => Date.now());
    try {
      await page.clock.pauseAt(now + gap);
      return;
    } catch (error) {
      if (attempt >= 3 || !String(error).includes("past")) throw error;
      gap *= 2;
    }
  }
}

/**
 * Opens `url` with the fake clock installed (`freezeClock`), waits for React to take over the page, then stops
 * time (`pauseClock`). From here a test moves time itself, with `stepUntil` or `page.clock.runFor`.
 */
export async function openFrozen(page: Page, url: string) {
  await freezeClock(page);
  await page.goto(url);
  await waitForHydration(page);
  await pauseClock(page);
}

/**
 * Moves the paused fake clock 10 ms at a time (`page.clock.runFor(10)`) until `until(await read())` is true, and
 * returns that value. It gives up after 5 s of fake time. A frame-driven value (the meter) changes only when a
 * requestAnimationFrame is due, about every 16 ms, so `read` may repeat a value for a step or two.
 */
export async function stepUntil(
  page: Page,
  read: () => Promise<number>,
  until: (v: number) => boolean,
): Promise<number> {
  for (let elapsed = 0; elapsed <= 5000; elapsed += 10) {
    const value = await read();
    if (until(value)) return value;
    await page.clock.runFor(10);
  }
  throw new Error("stepUntil: condition never met in 5 s of game time");
}

/** The centre panel of the layout on screen: Yash's unlock (`data-kind=unlock`) or the visitor's words (`yours`). */
export const spotlight = (page: Page) => page.locator("[data-game] [data-kind]:visible");

/**
 * What the centre shows right now: "unlock", "yours" or "none". Read at once, without waiting: the visitor's words pop in
 * from nothing, so for their first frame Playwright's `:visible` calls the panel hidden; a panel with layout is on screen.
 */
export const spotlightKind = (page: Page) =>
  page
    .locator("[data-game] [data-kind]")
    .evaluateAll(
      (els) =>
        els.find((el) => el.getClientRects().length > 0)?.getAttribute("data-kind") ?? "none",
    );

/**
 * Phase 9: Yash's point puts the work it unlocked in the centre (the title is the panel's second line); `wait(ms)`
 * moves the game on, and by SPOTLIGHT_MS + 500 the panel is gone and the card for that title stands at the side (the
 * phone's chip). Returns the title.
 */
export async function expectUnlockThenCard(page: Page, wait: (ms: number) => Promise<void>) {
  const panel = spotlight(page);
  await expect(panel).toHaveAttribute("data-kind", "unlock");
  const title = ((await panel.locator("span").nth(1).textContent()) ?? "").trim();
  expect(title).not.toBe("");
  await wait(SPOTLIGHT_MS + 500);
  await expect(spotlight(page)).toHaveCount(0);
  await expect(
    page.locator("[data-game]").getByText(title, { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible();
  return title;
}

/** The value of a CSS variable on the game root (`--meter` / `--power`). Exactly one `[data-game]` may be on the page. */
export const cssVar = (page: Page, name: string) =>
  page
    .locator("[data-game]")
    .evaluate((el, n) => Number(getComputedStyle(el).getPropertyValue(n) || 0), name);

/** Review Focus 5: the widths and heights every game is checked at. */
export const VIEWPORTS = [
  [2560, 1080],
  [1440, 900],
  [1366, 768],
  [1280, 720],
  [1200, 800],
  [1199, 800],
  [1024, 768],
  [768, 1024],
  [390, 844],
  [375, 667],
  [360, 640],
  // A phone held sideways: short, so the column's compact rule applies.
  [844, 390],
  [667, 375],
] as const;

/** Mono text is never drawn under 11 px on screen (A2); this leaves room for rounding. */
const MONO_FLOOR = 10.9;
/** A touch target is at least this tall (A5, G11). */
const TARGET = 44;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** No visible mono text renders under 11 px (the size after the stage's scale is applied; A2). */
export async function expectMonoFloor(page: Page) {
  const small = await page.evaluate((floor) => {
    const mono = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-mono")
      .split(",")[0]
      ?.replace(/["']/g, "")
      .trim();
    const offenders: string[] = [];
    for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
      const hasText = [...el.childNodes].some(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
      );
      if (!hasText || !el.checkVisibility()) continue;
      const style = getComputedStyle(el);
      if (!mono || !style.fontFamily.includes(mono)) continue;
      const rect = el.getBoundingClientRect();
      // A screen-reader-only node is a 1px box: not drawn.
      if (rect.width <= 2 || rect.height <= 2) continue;
      // offsetWidth is rounded to a whole pixel, so allow half a pixel of it (a short word like "HUB" read 10.8px on Linux)
      const scale = el.offsetWidth > 0 ? rect.width / (el.offsetWidth - 0.5) : 1;
      const size = parseFloat(style.fontSize) * scale;
      if (size < floor) {
        offenders.push(`"${el.textContent?.trim().slice(0, 30)}" renders at ${size.toFixed(1)}px`);
      }
    }
    return offenders;
  }, MONO_FLOOR);
  expect(small, "mono text under 11px").toEqual([]);
}

/**
 * What a game screen must hold at the current viewport (Review Focus 5). It fails with a readable list if:
 *  - the page scrolls sideways;
 *  - the page does not have exactly one rendered `h1` (an h1 hidden by CSS does not count; a screen-reader-only one does);
 *  - any visible mono text renders under 11 px (the size after the stage's scale is applied);
 *  - SKIP or QUICK VIEW is missing, under 44 px tall, or the two overlap. On the stage the 44 px is judged in the
 *    1440×900 design space (the stage is a picture that scales to the window); in the column it is judged on screen;
 *  - on the column, the thumb zone or the meter (`[data-game-column] [data-part=thumb]`) reaches outside the viewport;
 *  - on the column, SKIP, QUICK VIEW or the spotlight (when one is shown) is under the thumb zone's controls, or the call is off screen.
 */
export async function expectGameViewport(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "horizontal overflow (px)").toBeLessThanOrEqual(0);

  await expect(page.getByRole("heading", { level: 1 }), "rendered h1s").toHaveCount(1);

  await expectMonoFloor(page);

  const skip = page.getByRole("link", { name: new RegExp(`^${ui.hub.venue.skip}`) });
  const quick = page.getByRole("link", { name: ui.hud.quickView });
  await expect(skip, "SKIP is visible").toBeVisible();
  await expect(quick, "QUICK VIEW is visible").toBeVisible();
  const boxes: Box[] = [];
  for (const [what, link] of [
    ["SKIP", skip],
    ["QUICK VIEW", quick],
  ] as const) {
    const box = await link.boundingBox();
    expect(box, `${what} has a box`).not.toBeNull();
    boxes.push(box!);
    const designHeight = await link.evaluate((el) =>
      el.closest("[data-stage]")
        ? (el as HTMLElement).offsetHeight
        : el.getBoundingClientRect().height,
    );
    expect(designHeight, `${what} height`).toBeGreaterThanOrEqual(TARGET);
  }
  const [a, b] = boxes as [Box, Box];
  const overlap =
    a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
  expect(overlap, "SKIP and QUICK VIEW overlap").toBe(false);

  const thumb = page.locator("[data-game-column] [data-part=thumb]");
  if (await thumb.isVisible()) {
    const view = page.viewportSize()!;
    const box = await thumb.boundingBox();
    expect(box, "the thumb zone has a box").not.toBeNull();
    expect(box!.y + box!.height, "the thumb zone's bottom edge").toBeLessThanOrEqual(
      view.height + 0.5,
    );
    expect(box!.y, "the thumb zone's top edge").toBeGreaterThanOrEqual(0);

    // What is drawn in the thumb zone is its first child (the zone itself is a fade that spans more).
    const controls = await thumb.locator("> div").boundingBox();
    expect(controls, "the thumb controls have a box").not.toBeNull();
    const under = (what: string, b: Box) =>
      expect(
        b.y + b.height <= controls!.y + 0.5 ||
          b.y >= controls!.y + controls!.height ||
          b.x + b.width <= controls!.x ||
          b.x >= controls!.x + controls!.width,
        `${what} (${JSON.stringify(b)}) is under the thumb controls (${JSON.stringify(controls)})`,
      ).toBe(true);
    under("SKIP", a);
    under("QUICK VIEW", b);

    const calls = spotlight(page);
    if ((await calls.count()) > 0) {
      const at = await calls.first().boundingBox();
      expect(at, "the call has a box").not.toBeNull();
      expect(at!.y, "the call's top edge").toBeGreaterThanOrEqual(0);
      expect(at!.y + at!.height, "the call's bottom edge").toBeLessThanOrEqual(view.height);
      expect(
        at!.y + at!.height,
        `the call (bottom ${at!.y + at!.height}) is under the thumb controls (top ${controls!.y})`,
      ).toBeLessThanOrEqual(controls!.y + 0.5);
    }
  }
}
