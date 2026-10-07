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

  const board = ref("board-bg");
  it("led-white on board-bg (scoreboard text)", () => {
    expect(contrast(ref("led-white"), board)).toBeGreaterThanOrEqual(4.5);
  });

  it("dim on board-bg (scoreboard labels)", () => {
    expect(contrast(ref("dim"), board)).toBeGreaterThanOrEqual(4.5);
  });

  it("scout-grey on board-bg (scoreboard header)", () => {
    expect(contrast(ref("scout-grey"), board)).toBeGreaterThanOrEqual(4.5);
  });

  it("volt on board-bg (scoreboard subtitle and status)", () => {
    expect(contrast(ref("volt"), board)).toBeGreaterThanOrEqual(4.5);
  });

  it("scout-grey on line (ScoreBug away chip, line tone)", () => {
    expect(contrast(ref("scout-grey"), ref("line"))).toBeGreaterThanOrEqual(4.5);
  });

  it("text-2 on line (ScoreBug meta cell)", () => {
    expect(contrast(ref("text-2"), ref("line"))).toBeGreaterThanOrEqual(4.5);
  });

  it("scout-grey on stand (ScoreBug away chip)", () => {
    expect(contrast(ref("scout-grey"), stand)).toBeGreaterThanOrEqual(4.5);
  });

  it("stand on floodlight (ScoreBug name chip, dark text on white)", () => {
    expect(contrast(stand, ref("floodlight"))).toBeGreaterThanOrEqual(4.5);
  });
});

// The Trophy Room (spec 5.1): gold text, and the usual greys, on the cabinet's gradient, on glass over the
// trophy ground, and on the academy card's gradient.
describe("trophy zone text contrast (WCAG AA 4.5:1)", () => {
  const trophyGround = ref("ground-trophy");
  const zoneBackgrounds: Record<string, Rgb> = {
    "cabinet-hi (top of the cabinet)": ref("cabinet-hi"),
    "cabinet-lo (bottom of the cabinet)": ref("cabinet-lo"),
    "glass over the trophy ground (plinth panel)": over(
      stand,
      glassAlpha("surface-glass"),
      trophyGround,
    ),
    "panel (academy card, top)": stand,
    "stand-3 (academy card, bottom)": ref("stand-3"),
  };
  const zoneTexts = ["gold", "scout-grey", "dim"] as const;

  for (const [bgName, bg] of Object.entries(zoneBackgrounds)) {
    for (const text of zoneTexts) {
      it(`${text} on ${bgName}`, () => {
        expect(contrast(ref(text), bg)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  for (const [bgName, bg] of Object.entries(zoneBackgrounds).filter(([name]) =>
    /panel|stand-3|glass/.test(name),
  )) {
    for (const text of ["floodlight", "text-1", "text-2", "volt"] as const) {
      it(`${text} on ${bgName}`, () => {
        expect(contrast(ref(text), bg)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

// The Player Card: text on the three stops of its 160deg gradient, and in the stat cells (inset).
describe("player card text contrast (WCAG AA 4.5:1)", () => {
  const cardStops: Record<string, Rgb> = {
    "stand-hi (card top)": ref("stand-hi"),
    "stand-3 (card middle)": ref("stand-3"),
    "card-end (card foot)": ref("card-end"),
    "inset (stat cell)": ref("stand-2"),
  };
  for (const [bgName, bg] of Object.entries(cardStops)) {
    for (const text of ["floodlight", "text-2", "scout-grey", "dim", "volt"] as const) {
      it(`${text} on ${bgName}`, () => {
        expect(contrast(ref(text), bg)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
  it("volt-ink-2 on volt (the primary action row's sub-line)", () => {
    expect(contrast(ref("volt-ink-2"), ref("volt"))).toBeGreaterThanOrEqual(4.5);
  });
});
