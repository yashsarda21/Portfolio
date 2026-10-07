import { expect, test, type Page } from "@playwright/test";
import { expectMatchesArtboard } from "../support/visual";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

test("Landing stadium + scoreboard match the Main artboard", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Main is a 1440×900 board");
  await page.goto(story("scene-stadium--landing-fidelity"));
  await page.locator("#storybook-root > *").first().waitFor();
  // Let the floodlight flicker finish (last bank at 2.0s + 1.6s).
  await page.waitForTimeout(3800);
  const ratio = await expectMatchesArtboard(page, "Main", {
    maxDiffRatio: 0.02,
    maskRects: [
      { x: 20, y: 10, width: 300, height: 56 }, // HUD brand lockup (0D/Phase 3)
      { x: 1120, y: 10, width: 300, height: 56 }, // HUD controls (0D/Phase 3); the small floodlight banks between stay compared
      { x: 360, y: 540, width: 720, height: 170 }, // challenge line + CTAs (Phase 3)
      { x: 30, y: 815, width: 400, height: 60 }, // commentary (Phase 3)
      { x: 1080, y: 828, width: 340, height: 32 }, // keyboard hint (Phase 3)
      { x: 560, y: 368, width: 320, height: 52 }, // subtitle: reference shows collapsed boot tracking (carry-over, Phase 3)
    ],
  });
  expect(ratio).toBeLessThanOrEqual(0.02);
});

/** Each beam's top edge (the first two clip-path points) against the large bank it should come from. */
async function expectApexOnBank(page: Page, storyId: string) {
  await page.goto(story(storyId));
  await page.locator("#storybook-root > *").first().waitFor();
  const spans = await page.evaluate(() => {
    const measure = (cone: string, bank: string) => {
      const c = document.querySelector<HTMLElement>(`[data-part="${cone}"]`)!;
      const b = document
        .querySelector<HTMLElement>(`[data-part="${bank}"]`)!
        .getBoundingClientRect();
      const box = c.getBoundingClientRect();
      // computed clip-path: "polygon(7.4074% 0px, 28.1481% 0px, ...)"
      const points = getComputedStyle(c)
        .clipPath.match(/polygon\((.*)\)/)![1]!
        .split(",");
      const [a, z] = points.slice(0, 2).map((p) => parseFloat(p) / 100);
      return {
        a: box.left + a! * box.width,
        z: box.left + z! * box.width,
        bank: [b.left, b.right],
      };
    };
    return [measure("cone-left", "bank-1"), measure("cone-right", "bank-4")];
  });
  expect(spans).toHaveLength(2);
  for (const { a, z, bank } of spans) {
    expect(a).toBeCloseTo(bank[0]!, 0);
    expect(z).toBeCloseTo(bank[1]!, 0);
  }
}

test("Landing cones: each beam's top edge spans its large bank (D-1)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Main is a 1440×900 board");
  await expectApexOnBank(page, "scene-stadium--landing-backdrop");
});

test("Intro cones: each beam's top edge spans its large flat bank (D-1)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Intro is a 1440×900 board");
  await expectApexOnBank(page, "scene-stadium--intro-backdrop");
});

test("Boot presets: hidden before their turn, and the subtitle settles on its own .42em", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Main is a 1440×900 board");
  await page.goto(story("broadcast-boards--boot-presets"));
  const title = page.getByText("SOFTWARE ENGINEER");
  await title.waitFor();
  // The play function finishes every animation: the end state is the element's own styles.
  await expect
    .poll(() => title.evaluate((el) => getComputedStyle(el).letterSpacing))
    .toBe("12.6px");
  expect(await title.evaluate((el) => getComputedStyle(el).visibility)).toBe("visible");
  expect(await title.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  // Replayed from the start, a part waiting for its turn is hidden (so it cannot take focus).
  const hidden = await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('[data-boot="name"]')!;
    const animation = el.getAnimations()[0]!;
    animation.cancel();
    animation.currentTime = 0;
    animation.pause();
    return getComputedStyle(el).visibility;
  });
  expect(hidden).toBe("hidden");
});

test("Boot presets: a return visit runs in a quarter of the time", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Main is a 1440×900 board");
  await page.goto(story("broadcast-boards--boot-presets"));
  await page.getByText("SOFTWARE ENGINEER").waitFor();
  const timing = () =>
    page.evaluate(() => {
      const t = document
        .querySelector<HTMLElement>('[data-boot="name"]')!
        .getAnimations()[0]!
        .effect!.getComputedTiming();
      return { duration: t.duration, delay: t.delay };
    });
  expect(await timing()).toEqual({ duration: 1200, delay: 300 });
  await page.evaluate(() => document.documentElement.setAttribute("data-return-visit", ""));
  expect(await timing()).toEqual({ duration: 300, delay: 75 });
});
