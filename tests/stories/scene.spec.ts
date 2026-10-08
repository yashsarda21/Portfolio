import { expect, test, type Page } from "@playwright/test";
import { PNG } from "pngjs";
import { cropPng, diffImages, expectMatchesArtboard, readReference } from "../support/visual";

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

test("Hub backdrop matches the Hub artboard (every box of UI masked)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Hub is a 1440×900 board");
  await page.goto(story("scene-stadium--hub-backdrop"));
  await page.locator("#storybook-root > *").first().waitFor();
  const ratio = await expectMatchesArtboard(page, "Hub", {
    maxDiffRatio: 0.02,
    maskRects: [
      { x: 0, y: 0, width: 1440, height: 76 }, // HUD
      { x: 36, y: 104, width: 236, height: 760 }, // left rail
      { x: 300, y: 100, width: 440, height: 90 }, // kicker + title
      { x: 296, y: 190, width: 1120, height: 464 }, // the three venue cards (rotated, so a little wider)
      { x: 304, y: 672, width: 1100, height: 96 }, // facilities
      { x: 304, y: 820, width: 420, height: 46 }, // commentary
      { x: 1060, y: 830, width: 350, height: 28 }, // hint
    ],
  });
  expect(ratio).toBeLessThanOrEqual(0.02);
});

test("Venue art: the tennis picture matches the middle card's art box", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Hub is a 1440×900 board");
  await page.goto(story("scene-stadium--venue-arts"));
  const art = page.locator('[data-venue="court"]');
  await art.waitFor();
  const actual = PNG.sync.read(await art.screenshot({ animations: "disabled", caret: "hide" }));
  expect([actual.width, actual.height]).toEqual([348, 200]);
  // The middle card is only translated -14px in the artboard, so its art box is x 680-1028, y 192-392. The
  // left and right cards are rotated in the artboard (rotateY +-10deg), so they have no straight crop: the
  // cricket and badminton pictures are eyeball-reviewed instead. 3%: the card's own 1px edge and antialiasing.
  const expected = cropPng(await readReference("Hub", 1440, 900), {
    x: 680,
    y: 192,
    width: 348,
    height: 200,
  });
  const { ratio } = diffImages(actual, expected, []);
  if (process.env.LOG_RATIOS) console.log(`[ratio] Hub venue art (tennis) ${ratio}`);
  expect(ratio).toBeLessThanOrEqual(0.03);
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

test("Boot presets: the name waits faded out (still in the page), and the subtitle settles on its own .42em", async ({
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
  // Replayed from the start, the name waits at opacity 0 but stays visible to the page (it is not interactive,
  // and the page heading must stay readable and focusable during the boot).
  const waiting = await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('[data-boot="name"]')!;
    const animation = el.getAnimations()[0]!;
    animation.cancel();
    animation.currentTime = 0;
    animation.pause();
    const style = getComputedStyle(el);
    return { visibility: style.visibility, opacity: style.opacity };
  });
  expect(waiting).toEqual({ visibility: "visible", opacity: "0" });
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
