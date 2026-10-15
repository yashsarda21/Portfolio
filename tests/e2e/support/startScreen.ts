import { expect, type Page } from "@playwright/test";
import { ui } from "../../../src/content/ui-copy";

const start = ui.landing.start;

/** The first-visit start screen. */
export const startScreen = (page: Page) => page.getByRole("dialog", { name: start.label });
export const soundOn = (page: Page) => page.getByRole("button", { name: start.soundOn });
export const inSilence = (page: Page) => page.getByRole("button", { name: start.silent });

/**
 * A fresh profile's first Landing waits behind the start screen. Press a button the way a visitor would
 * (the default is KICK OFF IN SILENCE: nothing plays) and wait until the boot has been let go.
 */
export async function dismissStart(page: Page, choice: "silence" | "sound" = "silence") {
  await (choice === "sound" ? soundOn(page) : inSilence(page)).click();
  await expect(page.locator("html")).toHaveAttribute("data-started", "");
  await expect(startScreen(page)).toBeHidden();
}

/** Opens the Landing on a fresh profile and gets past the start screen, so the boot is playing. */
export async function gotoLanding(page: Page, choice: "silence" | "sound" = "silence") {
  await page.goto("/");
  await dismissStart(page, choice);
}
