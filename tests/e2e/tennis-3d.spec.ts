import { expect as baseExpect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { expectNoA11yViolations } from "../support/a11y";
import { waitForHydration } from "./support/contentPage";
import { game, phaseOf, stored } from "./support/cricket";
import { forceLuck, freezeClock, pauseClock } from "./support/game";
import { jump, open3d, pickOpen, pickSide, untilPhase } from "./support/three";

// The 3D game in software WebGL (the desktop-3d and mobile-3d projects): slow to draw, so time moves in jumps. While
// the software GPU catches up with the frames a jump drew, the browser's own frames wait (CSS animations, a media
// query's change), so assertions get longer than the usual 5 s.
test.describe.configure({ timeout: 180_000 });
const expect = baseExpect.configure({ timeout: 20_000 });

const tennis = ui.games.tennis;
const three = tennis.three;
const URL = "/arena/tennis";

/** Collects the page's errors: the 3D game must never reach the console with one. */
function watchErrors(page: Page, allow: RegExp[] = []): string[] {
  const errors: string[] = [];
  const keep = (text: string) => !allow.some((a) => a.test(text)) && errors.push(text);
  page.on("pageerror", (e) => keep(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") keep(m.text());
  });
  return errors;
}

const onStage = (page: Page) => page.locator("[data-stage]").isVisible();
/** The big call of the layout on screen. */
const call = (page: Page) => page.locator("[data-game] [data-tone]:visible");
const canvases = (page: Page) => page.locator("canvas");
const bug = (page: Page) =>
  page.locator(`[data-game] [role=group][aria-label="${ui.games.bug}"]:visible`);
const skip = (page: Page) => page.locator("[data-game] a[href='/highlights']:visible").first();

/** The score bug of the layout on screen reads Yash's points, then yours. */
async function expectScore(page: Page, yash: string, you: string) {
  const cells = bug(page).locator(":scope > span");
  await expect(cells.nth(1)).toHaveText(yash);
  await expect(cells.nth(2)).toHaveText(you);
}

/** Where the parts around the 3D's arrival sit: SKIP, the score bug, and on the phone the thumb zone. */
async function around(page: Page) {
  const parts = [skip(page), bug(page)];
  if (!(await onStage(page)))
    parts.push(page.locator("[data-game-column] [data-part=thumb] > div"));
  return Promise.all(parts.map((p) => p.boundingBox()));
}

/** Hides the tab or brings it back, as switching tabs does. */
const tab = (page: Page, state: "hidden" | "visible") =>
  page.evaluate((s) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => s });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => s === "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  }, state);

/** A point won with two picks to the open side: the window, the rally ball, the second window, the call. */
async function winPoint(page: Page) {
  await untilPhase(page, ["window"]);
  await pickOpen(page);
  await untilPhase(page, ["window"]);
  await pickOpen(page);
  await untilPhase(page, ["called", "verdict"]);
}

test("the loader shows while the files download, then one canvas; nothing moves when the 3D arrives", async ({
  page,
}) => {
  const errors = watchErrors(page);
  // Hold one file back until the loader has been seen.
  let letGo = () => {};
  const held = new Promise<void>((resolve) => (letGo = resolve));
  await page.route("**/models/moves.glb", async (route) => {
    await held;
    await route.continue();
  });
  await freezeClock(page);
  await page.goto(URL);
  await waitForHydration(page);
  await expect(game(page)).toHaveAttribute("data-three", "loading");
  await expect(page.getByRole("progressbar", { name: three.loading })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const before = await around(page);
  letGo();
  await page.locator("[data-game][data-three=ready]").waitFor({ timeout: 30_000 });
  await pauseClock(page);
  await jump(page, 500);
  // The loading board holds the controls' place: the swap to the 3D shifts nothing (Lighthouse's CLS).
  expect(before.every(Boolean)).toBe(true);
  expect(await around(page)).toEqual(before);

  await expect(canvases(page)).toHaveCount(1);
  const aims = (await onStage(page))
    ? page.locator("[data-stage] button[data-state]")
    : page.locator("[data-game-column] [data-part=thumb] button[data-game-control]");
  await expect(aims).toHaveCount(2);
  for (const aim of await aims.all()) await expect(aim).toBeVisible();
  expect(errors).toEqual([]);
});

test("no input: four aces, 40–0, and GAME YASH is saved", async ({ page }) => {
  const errors = watchErrors(page);
  await forceLuck(page, 0.2);
  await open3d(page, URL);
  await untilPhase(page, ["end"], 60_000);
  expect((await stored(page)).lastScores.tennis).toBe(tennis.status.game);
  await expectScore(page, "40", "0");
  expect(errors).toEqual([]);
});

test("perfect play: two WINNERs, then OUT by a whisker; 40–30, GAME YASH saved", async ({
  page,
}) => {
  const errors = watchErrors(page);
  await forceLuck(page, 0.2); // every open side is the left
  await open3d(page, URL);
  const calls: string[] = [];
  let was: string | null = null;
  for (let spent = 0; spent <= 120_000; spent += 250) {
    const phase = await phaseOf(page);
    if (phase === "end") break;
    const calling = phase === "called" || phase === "verdict";
    if (calling && was !== "called" && was !== "verdict") calls.push(await call(page).innerText());
    was = phase;
    if (phase === "window") await pickSide(page, "left");
    else await jump(page, 250);
  }
  expect(await phaseOf(page)).toBe("end");
  const { winner, out } = three.calls;
  expect(calls).toEqual([winner, winner, out, out, out, out]);
  await expectScore(page, "40", "30");
  expect((await stored(page)).lastScores.tennis).toBe(tennis.status.game);
  expect(errors).toEqual([]);
});

test("Review Focus 1: mashing in the toss is TOO EARLY once; a press while your swing is under way does nothing", async ({
  page,
}) => {
  const errors = watchErrors(page);
  await forceLuck(page, 0.2);
  await open3d(page, URL);

  await untilPhase(page, ["toss"]);
  for (let k = 0; k < 3; k++) await pickSide(page, "left");
  await expect(game(page)).toHaveAttribute("data-phase", "struck");
  await untilPhase(page, ["called"]);
  await expect(call(page)).toHaveText(tennis.calls.early);
  await expectScore(page, "15", "0");

  // A good return, then a press in "struck": it is not your second shot (that would be TOO EARLY, with no rally ball).
  await untilPhase(page, ["window"]);
  await pickOpen(page);
  await expect(game(page)).toHaveAttribute("data-phase", "struck");
  await pickSide(page, "left");
  await pickSide(page, "right");
  expect(await phaseOf(page)).toBe("struck");
  expect(await untilPhase(page, ["rally", "called"])).toBe("rally");
  await expectScore(page, "15", "0");
  expect(errors).toEqual([]);
});

test("Review Focus 2: a hidden tab drops the point; back, it is played again fresh and counts once", async ({
  page,
}) => {
  const errors = watchErrors(page);
  await forceLuck(page, 0.2);
  await open3d(page, URL);

  await untilPhase(page, ["window"]);
  await tab(page, "hidden");
  await expect(game(page)).toHaveAttribute("data-phase", "ready");
  // Far longer than the window and the call: nothing is judged or played while away. One jump, so one frame: 24
  // frames of software WebGL would leave the browser's own frames (the call's pop) far behind under load.
  await page.clock.fastForward(6000);
  expect(await phaseOf(page)).toBe("ready");
  await expectScore(page, "0", "0");

  // Back: the point is played again from Yash's routine.
  await tab(page, "visible");
  await untilPhase(page, ["toss"]);
  await winPoint(page);
  await expect(call(page)).toHaveText(three.calls.winner);
  await expectScore(page, "0", "15");
  expect((await stored(page)).lastScores?.tennis).toBeUndefined();
  expect(errors).toEqual([]);
});

test("Review Focus 3: resizing across 1200px mid-point keeps one canvas, and the point counts once", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-3d", "a resize from the stage to the column");
  const errors = watchErrors(page);
  await forceLuck(page, 0.2);
  await open3d(page, URL);

  await untilPhase(page, ["window"]);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("[data-game-column] canvas")).toHaveCount(1);
  await expect(canvases(page)).toHaveCount(1);
  await pickOpen(page);
  await untilPhase(page, ["window"]);
  await pickOpen(page);
  await untilPhase(page, ["called"]);
  await expect(canvases(page)).toHaveCount(1);
  await expect(call(page)).toHaveText(three.calls.winner);
  await expectScore(page, "0", "15");
  await jump(page, 2000);
  await expectScore(page, "0", "15");
  await expect(canvases(page)).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("Review Focus 4: a model file that will not download gives the 2D game, which plays", async ({
  page,
}) => {
  // The one console line is the browser reporting the 404 this test forces.
  const errors = watchErrors(page, [/Failed to load resource.*404/]);
  await page.route("**/models/athlete.glb", (route) => route.fulfill({ status: 404 }));
  await forceLuck(page, 0.2);
  await freezeClock(page);
  await page.goto(URL);
  await waitForHydration(page);
  await expect(game(page)).not.toHaveAttribute("data-three", { timeout: 30_000 });
  await pauseClock(page);

  await expect(canvases(page)).toHaveCount(0);
  await untilPhase(page, ["window"]);
  await pickOpen(page);
  await untilPhase(page, ["called"]);
  await expect(call(page)).toBeVisible();
  expect([tennis.calls.clean, tennis.calls.returned]).toContain(await call(page).innerText());
  expect(errors).toEqual([]);
});

test("Review Focus 5: SKIP mid-rally leaves cleanly, no sound after, and coming back downloads nothing again", async ({
  page,
}) => {
  const errors = watchErrors(page);
  // Counts every sound the page starts (the code-made ones and the recordings).
  await page.addInitScript(() => {
    const w = window as unknown as { sounds: number };
    w.sounds = 0;
    const count = <K extends "createOscillator" | "createBufferSource">(name: K) => {
      const make = AudioContext.prototype[name] as (...a: unknown[]) => unknown;
      (AudioContext.prototype as unknown as Record<K, unknown>)[name] = function (
        this: AudioContext,
        ...a: unknown[]
      ) {
        w.sounds++;
        return make.apply(this, a);
      };
    };
    count("createOscillator");
    count("createBufferSource");
  });
  const sounds = () => page.evaluate(() => (window as unknown as { sounds: number }).sounds);
  await forceLuck(page, 0.2);
  await open3d(page, URL);

  await untilPhase(page, ["window"]);
  await pickOpen(page);
  await untilPhase(page, ["rally"]);
  // SKIP on the paused clock: time jumps through the page transition and on past the point's hits and its call.
  await skip(page).click({ force: true });
  for (let ms = 0; ms < 5000 && !page.url().endsWith("/highlights"); ms += 250)
    await jump(page, 250);
  await expect(page).toHaveURL(/\/highlights$/);
  const left = await sounds();
  await jump(page, 6000);
  await expect(page.locator("[data-game]")).toHaveCount(0);
  expect(await sounds()).toBe(left);
  expect((await stored(page)).lastScores?.tennis).toBeUndefined();

  // Back in real time: the files are kept, so nothing downloads again; the new canvas only compiles its shaders
  // before it shows (about 8 s in software GL, where a real GPU takes a moment).
  const fetched: string[] = [];
  page.on("request", (r) => {
    if (/\/models\/|\/scene-/.test(r.url())) fetched.push(r.url());
  });
  await page.clock.resume();
  await page.goBack();
  await expect(page).toHaveURL(/\/arena\/tennis$/);
  await expect(game(page)).toHaveAttribute("data-three", "ready");
  expect(fetched).toEqual([]);
  expect(errors).toEqual([]);
});

test("accessibility: the 3D page in a window has no violations", async ({ page }) => {
  await forceLuck(page, 0.2);
  await open3d(page, URL);
  await untilPhase(page, ["window"]);
  // axe waits on timers, which the fake clock holds: time runs for the scan.
  await page.clock.resume();
  await expectNoA11yViolations(page);
});
