import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { TOKEN_CATALOG } from "../../src/design-system/tokens/catalog";

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
    await page.keyboard.press("Tab"); // first stop is the skip link
    await expect(page.getByRole("link", { name: ui.skipToContent })).toBeFocused();
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

  test("glass surface blurs on desktop and goes solid on mobile", async ({ page }, testInfo) => {
    await page.goto("/");
    const backdrop = await page.evaluate(() => {
      const el = document.createElement("div");
      el.className = "glass";
      document.body.append(el);
      return getComputedStyle(el).backdropFilter;
    });
    expect(backdrop).toBe(testInfo.project.name === "desktop" ? "blur(14px)" : "blur(0px)");
  });

  test("glass surfaces yield to border and background utilities", async ({ page }) => {
    await page.goto("/");
    const styles = await page.evaluate(() => {
      const make = (className: string) => {
        const el = document.createElement("div");
        el.className = className;
        document.body.append(el);
        const s = getComputedStyle(el);
        return { border: s.borderColor, bg: s.backgroundColor, width: s.borderTopWidth };
      };
      return { border: make("glass border-volt"), bg: make("glass bg-panel") };
    });
    expect(styles.border.border).toBe("rgb(215, 255, 63)");
    expect(styles.border.width).toBe("1px");
    expect(styles.bg.bg).toBe("rgb(14, 20, 27)");
  });

  test("gold exists only inside the trophy zone", async ({ page }) => {
    await page.goto("/");
    const colours = await page.evaluate(() => {
      const zone = document.createElement("div");
      zone.dataset.zone = "trophy";
      const inside = document.createElement("span");
      inside.className = "text-gold";
      zone.append(inside);
      const outside = document.createElement("span");
      outside.className = "text-gold";
      document.body.append(outside, zone);
      return { outside: getComputedStyle(outside).color, inside: getComputedStyle(inside).color };
    });
    expect(colours.outside).not.toBe("rgb(212, 178, 106)");
    expect(colours.inside).toBe("rgb(212, 178, 106)");
  });

  test("built CSS keeps the unprefixed backdrop-filter", () => {
    expect(builtCss()).toMatch(/[{;]backdrop-filter:blur\(var\(--glass-blur\)\)/);
  });

  test("Tailwind defaults are locked out; tokens are in", () => {
    const css = builtCss();
    for (const banned of [
      ".bg-blue-500",
      ".rounded-lg",
      ".text-sm",
      ".shadow-md",
      ".font-sans",
      ".font-bold",
      ".tracking-wide",
      ".leading-tight",
    ]) {
      expect(css, `${banned} must not exist`).not.toContain(banned);
    }
    for (const allowed of [".bg-volt", ".type-d1", ".glass", ".ease-follow"]) {
      expect(css, `${allowed} must exist`).toContain(allowed);
    }
  });

  test("every catalogue swatch and shadow class is generated in the built CSS", () => {
    const css = builtCss();
    const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const classes = [...TOKEN_CATALOG.colors, ...TOKEN_CATALOG.shadows].map((t) => t.className);
    for (const className of classes) {
      expect(css, `.${className} must be generated`).toMatch(
        new RegExp(`\\.${escape(className)}[{,:]`),
      );
    }
  });
});
