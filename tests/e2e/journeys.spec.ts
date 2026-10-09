import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { advanceTo, game, pass, perfectOver, stored } from "./support/cricket";
import { waitForHydration } from "./support/contentPage";
import { cssVar, forceLuck, freezeClock, openFrozen, pauseClock, stepUntil } from "./support/game";

/*
 * Cross-page journeys (spec 9.1). Each walks the real site from one page to the next, the way a visitor does,
 * with the games on the fake clock (support/game.ts): the pages before and after a game run in real time (the
 * fake clock is installed but keeps flowing), and the game itself is paused and stepped, so no input depends on
 * how fast the host is. The per-game rules (zones, calls, every viewport) are in cricket / tennis / badminton.spec.ts.
 */

// A journey is many pages and many fake-clock steps, and the host is often loaded.
test.describe.configure({ timeout: 120_000 });

const cricket = ui.games.cricket;
const isPhone = (testInfo: { project: { name: string } }) => testInfo.project.name === "mobile";

/** A venue's card on the Hub: the stage's article or the phone's fixture. */
const venueCard = (page: Page, venue: string) =>
  page.getByRole("article").filter({ hasText: venue });
/**
 * Presses a venue's PLAY like a visitor. On the stage the card arc sways on its own and so is never "stable" to
 * Playwright's click; moving the pointer onto the button stops the sway (H9), so the pointer goes there first.
 */
async function pressPlay(page: Page, venue: string) {
  const play = venueCard(page, venue).getByRole("link", { name: /^PLAY$/ });
  await expect(play).toBeVisible();
  const box = await play.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(400);
  await play.click();
}
const wipe = (page: Page) => page.locator("[data-wipe] > div").first();
/** The Hub's index: the stage's rail, or the phone's drawer once opened. */
const openIndex = async (page: Page, phone: boolean) => {
  if (!phone) return page.locator("aside");
  await page.locator("[data-hub-column]").getByRole("button", { name: ui.hub.drawer.open }).click();
  return page.getByRole("dialog", { name: ui.hub.index.label });
};
const bowlButton = (page: Page) =>
  page.getByRole("button", { name: /^(BOWL · SPACE|TAP TO BOWL)$/ });

/** Collects uncaught exceptions: a journey must never reach one. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

/** Once the route has changed and the wipe has gone, waits for the game to take input, then stops its clock. */
async function arriveAndFreeze(page: Page, path: RegExp) {
  await expect(page).toHaveURL(path);
  await expect(wipe(page)).toBeHidden();
  await expect(game(page)).toHaveAttribute("data-phase", "ready");
  await pauseClock(page);
}

/** One ball of any quality: the cursor is read near the start of its sweep (a miss), then the ball is bowled. */
async function bowlAnyBall(page: Page, how: "click" | "key") {
  await stepUntil(
    page,
    () => cssVar(page, "--meter"),
    (v) => v < 0.2,
  );
  // The button is clicked without Playwright's own settle checks, which wait on animation frames the paused clock holds.
  if (how === "click") await bowlButton(page).click({ force: true });
  else await page.keyboard.press("Space");
  await pass(page);
}

/** Goes to the Hub the way a visitor does from a content page: the HUD link on the stage, the tab bar on the phone (`tabs`). */
async function backToHub(page: Page, tabs: boolean) {
  // The wipe from the page before swallows a press that lands while it still covers the screen: press again until it takes.
  await expect(async () => {
    const link = tabs
      ? page.getByRole("link", { name: ui.tabs.arena })
      : page.locator("a[href='/arena']:visible").first();
    await link.click({ timeout: 1000 });
    await expect(page).toHaveURL(/\/arena$/, { timeout: 1000 });
  }).toPass({ timeout: 10_000 });
}

test("Landing → Intro → Hub → Cricket → three balls → the scorecard → Career → the Hub remembers", async ({
  page,
}, testInfo) => {
  const phone = isPhone(testInfo);
  const errors = watchErrors(page);
  await forceLuck(page, 0.99);
  await freezeClock(page);

  await page.goto("/");
  await waitForHydration(page);
  await page.getByRole("link", { name: ui.landing.enter }).click();
  await expect(page).toHaveURL(/\/intro$/);
  // The Intro's call to action appears when the show reaches it.
  await page.getByRole("link", { name: ui.intro.enter }).click();
  await expect(page).toHaveURL(/\/arena$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.arena.heading);

  await pressPlay(page, ui.venues.cricket);
  await arriveAndFreeze(page, /\/arena\/cricket$/);

  for (let ball = 0; ball < 3; ball++) await bowlAnyBall(page, "click");
  await advanceTo(page, ["end"]);
  // Three misses: SIX, SIX, SIX (the last is a FOUR or SIX, never the 1 %): 18* NOT OUT.
  expect((await stored(page)).lastScores.cricket).toBe("18* NOT OUT");
  const see = page.getByRole("link", { name: cricket.see });
  await expect(see).toHaveAttribute("href", "/career");

  await page.clock.resume();
  await see.click();
  await expect(page).toHaveURL(/\/career$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await backToHub(page, phone);
  const cricketCard = venueCard(page, ui.venues.cricket);
  await expect(cricketCard).toContainText(phone ? "18* NOT OUT" : "PLAYED · 18* NOT OUT");
  await expect(cricketCard.getByRole("link", { name: ui.hud.rematch })).toBeVisible();
  // The count and the record: the stage keeps the record chip in its top row and the count in the rail; the phone keeps both in the drawer.
  const index = await openIndex(page, phone);
  await expect(index.getByText("1 OF 3 VENUES")).toBeVisible();
  const record = `${ui.hub.record.yash} 1 · ${ui.hub.record.you} 0`;
  await expect(
    phone ? index.getByText(record) : page.locator("[data-stage]").getByText(record),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe("SKIP on every game goes to its page", () => {
  const games = [
    ["cricket", ui.games.cricket.skip, /\/career$/],
    ["tennis", ui.games.tennis.skip, /\/highlights$/],
    ["badminton", ui.games.badminton.skip, /\/attributes$/],
  ] as const;
  for (const [name, label, path] of games) {
    test(name, async ({ page }) => {
      await page.goto(`/arena/${name}`);
      await waitForHydration(page);
      await page.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      // Skipping is not playing: nothing is saved for the venue.
      expect((await stored(page)).lastScores?.[name]).toBeUndefined();
    });
  }
});

test("the forced win: CLAIM YOUR WICKET → Giant Killer, and the Hub lists the Locker Room", async ({
  page,
}, testInfo) => {
  const phone = isPhone(testInfo);
  const errors = watchErrors(page);
  await forceLuck(page, 0);
  await openFrozen(page, "/arena/cricket");
  await perfectOver(page);
  const claim = page.getByRole("link", { name: cricket.claim });
  await expect(claim).toBeFocused();
  expect((await stored(page)).lockerRoomUnlocked).toBe(true);

  await page.clock.resume();
  await claim.click();
  await expect(page).toHaveURL(/\/arena\/giant-killer$/);
  // Phase 6 builds this screen; until then it is the placeholder, with its way back to the Hub.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.giantKiller.heading);

  // The placeholder's HUD mark goes to the Hub on every layout (it has no tab bar).
  await backToHub(page, false);
  const index = await openIndex(page, phone);
  const locker = index.getByRole("link", { name: new RegExp(ui.hub.index.links.lockerRoom.label) });
  await expect(locker).toBeVisible();
  await expect(locker).toContainText(ui.hub.index.links.lockerRoom.tag);
  expect(errors).toEqual([]);
});

test("keyboard only: Hub 1 → Cricket → Space ×3 → Tab to the end button → Enter → Career", async ({
  page,
}, testInfo) => {
  test.skip(isPhone(testInfo), "the Hub's 1 / 2 / 3 keys are a desktop shortcut (H10)");
  await forceLuck(page, 0.99);
  await freezeClock(page);
  await page.goto("/arena");
  await waitForHydration(page);
  await page.keyboard.press("1");
  await arriveAndFreeze(page, /\/arena\/cricket$/);

  for (let ball = 0; ball < 3; ball++) await bowlAnyBall(page, "key");
  await advanceTo(page, ["end"]);

  // The end puts focus on its first control; Tab until the scorecard link has it, never more than a few stops.
  const see = page.getByRole("link", { name: cricket.see });
  for (let stops = 0; stops < 8; stops++) {
    if (await see.evaluate((el) => el === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(see).toBeFocused();
  await page.clock.resume();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/career$/);
});

test("reduced motion: Hub PLAY → the cricket auto-rally → the end", async ({ page }, testInfo) => {
  const phone = isPhone(testInfo);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await forceLuck(page, 0.99);
  await freezeClock(page);
  await page.goto("/arena");
  await waitForHydration(page);
  await pressPlay(page, ui.venues.cricket);
  await expect(page).toHaveURL(/\/arena\/cricket$/);
  await expect(game(page)).toBeVisible();
  await pauseClock(page);

  // No live game: no BOWL button, no meter. The over plays itself in about 3 s.
  await expect(bowlButton(page)).toHaveCount(0);
  await page.clock.runFor(3000);
  await advanceTo(page, ["end"]);
  await expect(page.getByRole("link", { name: cricket.see })).toBeVisible();
  await expect(page.getByRole("button", { name: cricket.again })).toBeVisible();
  expect((await stored(page)).lastScores.cricket).toBe("14* NOT OUT");

  await page.clock.resume();
  await page.getByRole("link", { name: cricket.see }).click();
  await expect(page).toHaveURL(/\/career$/);
  await backToHub(page, phone);
  await expect(venueCard(page, ui.venues.cricket)).toContainText("14* NOT OUT");
});
