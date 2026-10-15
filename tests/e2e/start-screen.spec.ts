import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { expectNoA11yViolations } from "../support/a11y";
import { waitForHydration } from "./support/contentPage";
import { dismissStart, inSilence, soundOn, startScreen } from "./support/startScreen";

/*
 * The first-visit start screen (browsers allow no sound before a click) and what it gates: the Landing's boot and
 * the Home and Intro sound show. Nothing here is heard: the show's schedule is read from the page
 * (`data-show-scheduled` on <html> is the number of cues handed to the audio service).
 */

const html = (page: Page) => page.locator("html");
const enter = (page: Page) => page.getByRole("link", { name: ui.landing.enter });

/** The CSS boot's animations (motion.css), by the state they are in. */
const bootStates = (page: Page) =>
  page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) =>
        ["fade-in", "rise-in", "boot-name", "boot-scan"].includes(
          (a as CSSAnimation).animationName,
        ),
      )
      .map((a) => ({ state: a.playState, time: Number(a.currentTime) })),
  );

/** Counts the show's recordings as the page asks for them. */
function watchRecordings(page: Page) {
  const seen: string[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith("/audio/")) seen.push(path);
  });
  return seen;
}

test.describe("a fresh profile", () => {
  test("meets the start screen, with focus on SOUND ON and no sound file asked for yet", async ({
    page,
  }) => {
    const recordings = watchRecordings(page);
    await page.goto("/");
    await waitForHydration(page);
    await expect(startScreen(page)).toBeVisible();
    await expect(soundOn(page)).toBeFocused();
    await expect(inSilence(page)).toBeVisible();
    await expect(page.getByText(ui.landing.start.note)).toBeVisible();
    expect(recordings).toEqual([]);
  });

  test("holds the boot under it: every boot animation is paused at its start a second later", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForHydration(page);
    await page.waitForTimeout(1200);
    const held = await bootStates(page);
    expect(held.length).toBeGreaterThan(4);
    for (const a of held) expect(a).toEqual({ state: "paused", time: 0 });
    // And what the boot would have shown by now (the crowd, the first banks) has not appeared.
    await expect(page.getByRole("link", { name: ui.landing.enter })).toBeHidden();
  });

  test("has no heading of its own: the page's one h1 is still the only one", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(startScreen(page).getByRole("heading")).toHaveCount(0);
  });

  test("shuts the page behind it: Tab never reaches a link or button behind the screen", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForHydration(page);
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      const where = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return "page";
        return el.closest("[data-start-screen]") ? "start" : (el.textContent ?? "behind");
      });
      expect(["start", "page"], `Tab ${i + 1}: ${where}`).toContain(where);
    }
    await expect(page.locator("#main")).toHaveAttribute("inert", "");
  });

  test("has no accessibility violations while it is open", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await expect(startScreen(page)).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("keeps its targets at 44px or more", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    for (const button of [soundOn(page), inSilence(page)]) {
      const box = (await button.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  });

  test("Enter on the focused SOUND ON starts the show, then the page behind is open", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForHydration(page);
    await page.keyboard.press("Enter");
    await expect(html(page)).toHaveAttribute("data-started", "");
    await expect(startScreen(page)).toBeHidden();
    await expect(page).toHaveURL("/");
    await expect(page.locator("#main")).not.toHaveAttribute("inert", "");
  });

  test("Space on KICK OFF IN SILENCE starts the show too", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await inSilence(page).focus();
    await page.keyboard.press("Space");
    await expect(html(page)).toHaveAttribute("data-started", "");
  });

  test("KICK OFF · SOUND ON starts the boot, unlocks the sound and schedules the Home show", async ({
    page,
    viewport,
  }) => {
    const recordings = watchRecordings(page);
    await page.goto("/");
    await waitForHydration(page);
    await dismissStart(page, "sound");
    // Four clunks and the crowd on the stage; the column draws two banks, so two clunks and the crowd.
    const cues = (viewport?.width ?? 0) >= 1200 ? "5" : "3";
    await expect(html(page)).toHaveAttribute("data-show-scheduled", cues);
    await expect
      .poll(() => bootStates(page).then((s) => s.some((a) => a.state === "running")))
      .toBe(true);
    // The sound toggle shows ON.
    await expect(page.getByRole("button", { pressed: true })).toBeVisible();
    // Fetched only now, after the click.
    await expect.poll(() => recordings.sort()).toEqual(["/audio/crowd.mp3", "/audio/light.mp3"]);
    expect(await page.evaluate(() => localStorage.getItem("arena:audio"))).not.toBe("off");
  });

  test("KICK OFF IN SILENCE starts the boot with the sound toggle off, and asks for no recording", async ({
    page,
  }) => {
    const recordings = watchRecordings(page);
    await page.goto("/");
    await waitForHydration(page);
    await dismissStart(page, "silence");
    await expect
      .poll(() => bootStates(page).then((s) => s.some((a) => a.state === "running")))
      .toBe(true);
    expect(await page.evaluate(() => localStorage.getItem("arena:audio"))).toBe("off");
    await expect(html(page)).not.toHaveAttribute("data-show-scheduled");
    expect(recordings).toEqual([]);
  });

  test("a reload shows no start screen and plays the quick, silent boot", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await dismissStart(page, "sound");
    await page.reload();
    await waitForHydration(page);
    await expect(html(page)).toHaveAttribute("data-return-visit", "");
    await expect(startScreen(page)).toBeHidden();
    await expect(html(page)).not.toHaveAttribute("data-show-scheduled");
    expect(
      await page.evaluate(() =>
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pace")),
      ),
    ).toBe(0.25);
    await expect(enter(page)).toBeVisible({ timeout: 4000 });
  });

  test("coming back to Home by clicking inside the site cheers (the crowd alone): sound is unlocked", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForHydration(page);
    await dismissStart(page, "sound");
    await expect(enter(page)).toBeVisible({ timeout: 8000 });
    await enter(page).click();
    await expect(page).toHaveURL("/intro");
    await page.goBack();
    await expect(page).toHaveURL("/");
    await expect(html(page)).toHaveAttribute("data-return-visit", "");
    await expect(html(page)).toHaveAttribute("data-show-scheduled", "1");
  });

  test("ENTER THE ARENA plays the Intro show: the schedule reaches the audio service", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForHydration(page);
    await dismissStart(page, "sound");
    await expect(enter(page)).toBeVisible({ timeout: 8000 });
    await enter(page).click();
    await expect(page).toHaveURL("/intro");
    // The Intro's own show: four clunks and the crowd.
    await expect(html(page)).toHaveAttribute("data-show-scheduled", "5");
  });

  test("a visit reached by a shared link to another page never meets it there", async ({
    page,
  }) => {
    await page.goto("/arena");
    await waitForHydration(page);
    await expect(startScreen(page)).toHaveCount(0);
  });
});

test.describe("scripts off", () => {
  test.use({ javaScriptEnabled: false });
  test("no start screen: the boot just plays", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(startScreen(page)).toBeHidden();
    await expect(html(page)).not.toHaveClass(/js/);
  });
});
