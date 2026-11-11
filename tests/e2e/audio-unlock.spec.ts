import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { INTRO_BANKS } from "../../src/features/intro/beats";
import { ROUTES } from "../../src/shell/routes";
import { waitForHydration } from "./support/contentPage";

/*
 * A game reached directly (a shared link) has had no Landing or Intro click, so the sound must start from its own
 * first gesture: the sound toggle, or the game's first input. The page's audio context is only counted, never heard.
 */

type CountedWindow = Window & { __contexts: number };

async function countAudioContexts(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as CountedWindow;
    w.__contexts = 0;
    const Real = window.AudioContext;
    window.AudioContext = class extends Real {
      constructor(options?: AudioContextOptions) {
        super(options);
        w.__contexts++;
      }
    };
  });
}

const contexts = (page: Page) =>
  page.evaluate(() => (window as unknown as CountedWindow).__contexts);

async function open(page: Page, path: string) {
  await countAudioContexts(page);
  await page.goto(path);
  await waitForHydration(page);
  await expect(page.locator("[data-game]")).toHaveAttribute("data-phase", "ready");
  expect(await contexts(page), "no sound context before a gesture").toBe(0);
}

test("cricket: the first BOWL starts the sound", async ({ page }) => {
  await open(page, ROUTES.cricket);
  await page.keyboard.press("Space");
  await expect.poll(() => contexts(page)).toBe(1);
});

test("tennis: the first pick starts the sound", async ({ page }) => {
  await open(page, ROUTES.tennis);
  // Picks count once the first serve is on its way.
  await expect(page.locator("[data-game]")).not.toHaveAttribute("data-phase", "ready");
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => contexts(page)).toBe(1);
});

test("badminton: the first press starts the sound", async ({ page }) => {
  await open(page, ROUTES.badminton);
  await page.keyboard.down("Space");
  await expect.poll(() => contexts(page)).toBe(1);
  await page.keyboard.up("Space");
});

test("the sound toggle starts the sound when it turns it on (before any call to action)", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("arena:audio", "off"));
  await countAudioContexts(page);
  await page.goto(ROUTES.home);
  await waitForHydration(page);
  const toggle = page.getByRole("button", {
    name: new RegExp(`${ui.audio.label}|${ui.audio.labelPhone}`),
  });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => contexts(page)).toBe(1);
});

/*
 * The Home and Intro sound show: browsers allow no sound before a gesture, so the recordings are only fetched at
 * first, and the show joins on the first gesture (or plays where the browser allows autoplay, which a test browser
 * does not). `data-show-scheduled` on <html> is the number of cues handed to the audio service.
 */

const html = (page: Page) => page.locator("html");

/** The Intro's show: one clunk per floodlight bank its layout draws (4 on the stage from 1200px, 2 on the column below it), and the crowd. */
function introShowSounds(page: Page): string {
  const tier = (page.viewportSize()?.width ?? 0) < 1200 ? "mobile" : "desktop";
  return String(INTRO_BANKS[tier] + 1);
}

test("a first visit to the Home is silent: both recordings are fetched, no sound context is made, no show is scheduled", async ({
  page,
}) => {
  const asked: string[] = [];
  page.on("request", (r) => {
    const path = new URL(r.url()).pathname;
    if (path.startsWith("/audio/")) asked.push(path);
  });
  await countAudioContexts(page);
  await page.goto(ROUTES.home);
  await waitForHydration(page);
  await expect.poll(() => asked.sort()).toEqual(["/audio/crowd.mp3", "/audio/light.mp3"]);
  await page.mouse.click(5, 5);
  await page.keyboard.press("Space");
  expect(await contexts(page)).toBe(0);
  await expect(html(page)).not.toHaveAttribute("data-show-scheduled");
});

test("the Intro reached directly plays its show on the first gesture (one clunk per floodlight bank and the crowd)", async ({
  page,
}) => {
  await countAudioContexts(page);
  await page.goto(ROUTES.intro);
  await waitForHydration(page);
  expect(await contexts(page), "no sound before a gesture").toBe(0);
  await page.mouse.click(5, 5);
  await expect(html(page)).toHaveAttribute("data-show-scheduled", introShowSounds(page));
  await expect.poll(() => contexts(page)).toBe(1);
});

test("ENTER THE ARENA unlocks the sound, and the Intro it opens plays the full show at once", async ({
  page,
}) => {
  await page.goto(ROUTES.home);
  await waitForHydration(page);
  const enter = page.getByRole("link", { name: ui.landing.enter });
  await expect(enter).toBeVisible({ timeout: 10_000 });
  await enter.click();
  await expect(page).toHaveURL(ROUTES.intro);
  await expect(html(page)).toHaveAttribute("data-show-scheduled", introShowSounds(page));
});

test("sound saved as off: the Intro's first gesture schedules nothing audible", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("arena:audio", "off"));
  await countAudioContexts(page);
  await page.goto(ROUTES.intro);
  await waitForHydration(page);
  await page.mouse.click(5, 5);
  await expect(html(page)).not.toHaveAttribute("data-show-scheduled");
});
