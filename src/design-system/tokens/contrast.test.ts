import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// WCAG 2.x contrast for every text/background pair the primitives use. axe cannot check text
// on translucent glass (it reports "incomplete"), so this test is the enforcement.

const css = readFileSync(join(process.cwd(), "src/design-system/tokens/tokens.css"), "utf8");

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function ref(name: string): Rgb {
  const match = css.match(new RegExp(`--ref-${name}:\\s*(#[0-9a-fA-F]{6})\\b`));
  if (!match?.[1]) throw new Error(`--ref-${name} is not a hex token in tokens.css`);
  return hexToRgb(match[1]);
}

function glassAlpha(token: "surface-glass" | "surface-glass-solid"): number {
  const match = css.match(
    new RegExp(`--${token}:\\s*rgb\\(var\\(--rgb-stand\\)\\s*/\\s*([0-9.]+)\\)`),
  );
  if (!match?.[1]) throw new Error(`--${token} is not the stand colour at some alpha`);
  return Number(match[1]);
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

function over(top: Rgb, alpha: number, bottom: Rgb): Rgb {
  return [0, 1, 2].map((i) =>
    Math.round((top[i] ?? 0) * alpha + (bottom[i] ?? 0) * (1 - alpha)),
  ) as Rgb;
}

const ground = ref("ground");
const stand = ref("stand");
const glassOnGround = over(stand, glassAlpha("surface-glass"), ground);
const glassSolidOnGround = over(stand, glassAlpha("surface-glass-solid"), ground);

const backgrounds: Record<string, Rgb> = {
  "ground (also transparent outline buttons)": ground,
  "panel (stand)": stand,
  "inset (stand-2)": ref("stand-2"),
  "glass over ground": glassOnGround,
  "glass-solid over ground": glassSolidOnGround,
};

const texts = ["floodlight", "text-1", "text-2", "scout-grey", "dim"] as const;

describe("text contrast (WCAG AA 4.5:1)", () => {
  it("helper matches known reference values", () => {
    expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
    expect(contrast([119, 119, 119], [255, 255, 255])).toBeCloseTo(4.48, 2);
  });

  for (const [bgName, bg] of Object.entries(backgrounds)) {
    for (const text of texts) {
      it(`${text} on ${bgName}`, () => {
        expect(contrast(ref(text), bg)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it("volt-ink on volt (primary button label)", () => {
    expect(contrast(ref("volt-ink"), ref("volt"))).toBeGreaterThanOrEqual(4.5);
  });

  it("volt-ink-2 on volt (primary button sub-label)", () => {
    expect(contrast(ref("volt-ink-2"), ref("volt"))).toBeGreaterThanOrEqual(4.5);
  });

  it("volt-ink on volt-hover (primary button hovered)", () => {
    expect(contrast(ref("volt-ink"), ref("volt-hover"))).toBeGreaterThanOrEqual(4.5);
  });

  it("volt-ink-2 on volt-hover (primary sub-label hovered)", () => {
    expect(contrast(ref("volt-ink-2"), ref("volt-hover"))).toBeGreaterThanOrEqual(4.5);
  });

  it("volt on ground (ghost hover, pressed icon buttons)", () => {
    expect(contrast(ref("volt"), ground)).toBeGreaterThanOrEqual(4.5);
  });

  it("volt on glass over ground (pressed glass icon button)", () => {
    expect(contrast(ref("volt"), glassOnGround)).toBeGreaterThanOrEqual(4.5);
  });
});
