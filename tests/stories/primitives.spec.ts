import { expect, test } from "@playwright/test";

// a11y.manual: keeps Storybook's own a11y addon from auto-running axe against our checks.
const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

test.describe("Button", () => {
  test("XL hero CTA matches the artboard box and skew", async ({ page }, testInfo) => {
    await page.goto(story("primitives-button--hero-pair"));
    const cta = page.getByTestId("cta-primary");
    const box = await cta.evaluate((el) => {
      const { offsetWidth: w, offsetHeight: h } = el as HTMLElement;
      const plate = getComputedStyle(el.querySelector("[data-plate]") as Element);
      return { w, h, transform: plate.transform, bg: plate.backgroundColor };
    });
    expect(box.w).toBe(310);
    expect(box.h).toBe(78);
    expect(box.bg).toBe("rgb(215, 255, 63)");
    if (testInfo.project.name === "desktop") {
      // skewX(-12deg) → matrix(1, 0, -tan(12deg), 1, 0, 0) ≈ c = 0.2126
      expect(box.transform).toMatch(
        /^matrix\(1, 0, 0\.21\d*, 1, 0, 0\)$|^matrix\(1, 0, -0\.21\d*, 1, 0, 0\)$/,
      );
    } else {
      expect(box.transform).toBe("none");
    }
  });

  test("button focus ring is the volt outline", async ({ page }) => {
    await page.goto(story("primitives-button--hero-pair"));
    await page.getByTestId("cta-primary").waitFor();
    await page.keyboard.press("Tab");
    const ring = await page.evaluate(() => {
      const plate = (document.activeElement as Element).querySelector("[data-plate]") as Element;
      const s = getComputedStyle(plate);
      return { style: s.outlineStyle, color: s.outlineColor, width: s.outlineWidth };
    });
    expect(ring).toEqual({ style: "solid", color: "rgb(215, 255, 63)", width: "2px" });
  });

  test("reduced motion stops the CTA pulse", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(story("primitives-button--sizes"));
    const iterations = await page
      .getByTestId("cta-pulse")
      .evaluate(
        (el) =>
          getComputedStyle(el.querySelector("[data-plate]") as Element).animationIterationCount,
      );
    expect(iterations).toBe("1");
  });

  test("glass text is never on a transformed or blurred layer (crisp text)", async ({ page }) => {
    await page.goto(story("primitives-button--variants"));
    const secondary = page.getByRole("button", { name: "Secondary" });
    await secondary.waitFor();
    const root = await secondary.evaluate((el) => {
      const s = getComputedStyle(el);
      return { transform: s.transform, backdrop: s.backdropFilter };
    });
    expect(root).toEqual({ transform: "none", backdrop: "none" });
  });
});

test.describe("RadioCard", () => {
  test("radio card focus ring wraps the whole card", async ({ page }) => {
    await page.goto(story("primitives-form--format-cards"));
    await page.getByTestId("radio-sign").waitFor();
    await page.keyboard.press("Tab");
    const card = page.locator("label", { has: page.getByTestId("radio-sign") });
    // The card fades its colours in (--dur-snap), so poll until the transition settles.
    await expect
      .poll(() =>
        card.evaluate((el) => {
          const s = getComputedStyle(el);
          return { style: s.outlineStyle, color: s.outlineColor };
        }),
      )
      .toEqual({ style: "solid", color: "rgb(215, 255, 63)" });
  });

  test("selected card is volt-edged", async ({ page }) => {
    await page.goto(story("primitives-form--format-cards"));
    const card = page.locator("label", { has: page.getByTestId("radio-sign") });
    expect(await card.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(
      "rgb(215, 255, 63)",
    );
  });
});
