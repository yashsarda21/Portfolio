import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

function builtCss(): string {
  const dir = join(process.cwd(), "build/client/assets");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .join("\n");
}

test.describe("design tokens", () => {
  test("page ground and text use token colours", async ({ page }) => {
    await page.goto("/");
    const body = await page.evaluate(() => {
      const s = getComputedStyle(document.body);
      return { bg: s.backgroundColor, color: s.color };
    });
    expect(body.bg).toBe("rgb(5, 7, 10)");
    expect(body.color).toBe("rgb(242, 244, 245)");
  });

  test("display font loads with its fallback chain", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const h1 = page.getByRole("heading", { level: 1 });
    const family = await h1.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family).toContain("Big Shoulders Display");
    expect(family).toContain("Arial Narrow");
    const loaded = await page.evaluate(() =>
      document.fonts.check('900 84px "Big Shoulders Display"'),
    );
    expect(loaded).toBe(true);
  });

  test("keyboard focus shows the volt ring", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const ring = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const s = getComputedStyle(el);
      return {
        tag: el.tagName,
        style: s.outlineStyle,
        color: s.outlineColor,
        width: s.outlineWidth,
      };
    });
    expect(ring.tag).toBe("A");
    expect(ring.style).toBe("solid");
    expect(ring.color).toBe("rgb(215, 255, 63)");
    expect(ring.width).toBe("2px");
  });

  test("reduced motion collapses animations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const duration = await page.evaluate(() => {
      const el = document.createElement("div");
      el.style.animation = "spin 2s linear infinite";
      document.body.append(el);
      return parseFloat(getComputedStyle(el).animationDuration);
    });
    expect(duration).toBeLessThan(0.001);
  });

  test("Tailwind defaults are locked out; tokens are in", () => {
    const css = builtCss();
    for (const banned of [".bg-blue-500", ".rounded-lg", ".text-sm", ".shadow-md", ".font-sans"]) {
      expect(css, `${banned} must not exist`).not.toContain(banned);
    }
    for (const allowed of [".bg-volt", ".type-d1", ".glass", ".ease-follow"]) {
      expect(css, `${allowed} must exist`).toContain(allowed);
    }
  });
});
