import { expect, test } from "@playwright/test";

// a11y.manual: keeps Storybook's own a11y addon from auto-running axe against our checks.
const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

test.describe("Player Card pieces", () => {
  test("the card, the action rows and the channel cards are drawn at the artboard's boxes", async ({
    page,
  }, testInfo) => {
    await page.goto(story("broadcast-card--front"));
    const card = page.locator("[data-player-card]");
    await card.waitFor();
    const [width, height] = await card.evaluate((el) => [
      (el as HTMLElement).offsetWidth,
      (el as HTMLElement).offsetHeight,
    ]);
    if (testInfo.project.name === "desktop") {
      // 400x640 content box plus the 1px border all round.
      expect([width, height]).toEqual([402, 642]);
    } else {
      // On the phone it is fluid (never wider than drawn) and keeps the drawn proportions.
      expect(width).toBeLessThanOrEqual(402);
      expect(Math.abs(height / width - 642 / 402)).toBeLessThan(0.01);
    }

    await page.goto(story("broadcast-card--action-rows"));
    const rowHeight = (name: RegExp) =>
      page
        .locator("a, button")
        .filter({ hasText: name })
        .evaluate((el) => (el as HTMLElement).offsetHeight);
    expect(await rowHeight(/VIEW PLAYER CARD/)).toBe(74);
    expect(await rowHeight(/DOWNLOAD PDF/)).toBe(66); // 64 + the glass border
    expect(await rowHeight(/COPY SCOUTING LINK/)).toBe(66);

    await page.goto(story("broadcast-card--channel-cards"));
    expect(
      await page
        .getByRole("link", { name: /EMAIL/ })
        .evaluate((el) => (el as HTMLElement).offsetHeight),
    ).toBe(72); // 70 + the glass border
  });

  test("the card floats and shows a sheen, and under reduced motion does neither", async ({
    page,
  }) => {
    const animations = () =>
      page.evaluate(() => {
        const float = document.querySelector("[data-player-card] > div > div") as Element;
        const sheen = document.querySelector("[data-face=front] .card-sheen") as Element;
        return {
          float: getComputedStyle(float).animationName,
          sheen: getComputedStyle(sheen).animationName,
          sheenShown: getComputedStyle(sheen).display !== "none",
        };
      });
    await page.goto(story("broadcast-card--interactive"));
    await page.locator("[data-player-card]").waitFor();
    // Control: the animations really run without the preference, so the "none" below can't pass vacuously.
    expect(await animations()).toEqual({ float: "card-float", sheen: "sheen", sheenShown: true });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(story("broadcast-card--interactive"));
    await page.locator("[data-player-card]").waitFor();
    expect(await animations()).toEqual({ float: "none", sheen: "none", sheenShown: false });
  });

  test("Tab, Enter flips the card and focus stays on the visible face's button", async ({
    page,
  }) => {
    await page.goto(story("broadcast-card--interactive"));
    await page.locator("[data-player-card]").waitFor();
    await page.keyboard.press("Tab");
    const toBack = page.getByRole("button", { name: "Flip card: show the back" });
    await expect(toBack).toBeFocused();
    await page.keyboard.press("Enter");
    const toFront = page.getByRole("button", { name: "Flip card: show the front" });
    await expect(toFront).toBeFocused();
    // The back's links are now reachable; the front face is gone from the tab order.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "CAREER STATS" })).toBeFocused();
  });

  test("a link on the back face is clickable and does not flip the card", async ({ page }) => {
    await page.goto(story("broadcast-card--back"));
    const link = page.getByRole("link", { name: "CAREER STATS" });
    await link.waitFor();
    await link.click();
    await expect(page.locator("[data-player-card]")).toHaveAttribute("data-flipped", "true");
  });

  test("while the front shows, the back's links cannot be tabbed to", async ({ page }) => {
    await page.goto(story("broadcast-card--front"));
    await page.locator("[data-player-card]").waitFor();
    await expect(page.getByRole("link", { name: "CAREER STATS" })).toHaveCount(0);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => document.activeElement?.closest("[data-face=back]")),
    ).toBeNull();
  });

  test("reduced motion: the faces swap with no rotation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(story("broadcast-card--interactive"));
    await page.getByRole("button", { name: "Flip card: show the back" }).click();
    await page.getByRole("button", { name: "Flip card: show the front" }).waitFor();
    const state = await page.evaluate(() => {
      const flipper = document.querySelector("[data-player-card] > div > div > div") as Element;
      const vis = (face: string) =>
        getComputedStyle(document.querySelector(`[data-face=${face}]`) as Element).visibility;
      return {
        transform: getComputedStyle(flipper).transform,
        front: vis("front"),
        back: vis("back"),
      };
    });
    // rotateY(0) computes to the identity matrix: faces swapped, nothing turned.
    expect(state.transform).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    expect(state).toMatchObject({ front: "hidden", back: "visible" });
  });
});
