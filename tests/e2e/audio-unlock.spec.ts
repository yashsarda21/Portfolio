import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { ROUTES } from "../../src/shell/routes";
import { waitForHydration } from "./support/contentPage";
import { dismissStart } from "./support/startScreen";

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
  // The first visit's start screen: in silence leaves the saved "off" alone and makes no audio context.
  await dismissStart(page);
  expect(await contexts(page)).toBe(0);
  const toggle = page.getByRole("button", {
    name: new RegExp(`${ui.audio.label}|${ui.audio.labelPhone}`),
  });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => contexts(page)).toBe(1);
});
