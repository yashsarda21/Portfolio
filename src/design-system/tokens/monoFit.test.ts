import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/design-system/tokens/base.css"), "utf8");

/** Every `@utility name { ... }` block (balanced braces) by name. */
function utilities(source: string): Record<string, string> {
  const found: Record<string, string> = {};
  for (const m of source.matchAll(/@utility ([\w-]+) \{/g)) {
    let depth = 0;
    for (let i = m.index! + m[0].length - 1; i < source.length; i++) {
      if (source[i] === "{") depth++;
      if (source[i] === "}" && --depth === 0) {
        found[m[1]!] = source.slice(m.index!, i + 1);
        break;
      }
    }
  }
  return found;
}
const blocks = utilities(css);
const recipes = Object.entries(blocks).filter(([name]) => name.startsWith("type-mono-"));

describe("floored mono recipes go through the shared fit (L2)", () => {
  it("only mono-fit-size reads --stage-mono-min", () => {
    const readers = Object.entries(blocks)
      .filter(([, body]) => body.includes("var(--stage-mono-min"))
      .map(([name]) => name);
    expect(readers).toEqual(["mono-fit-size"]);
  });

  it("no recipe is left with its own max(Npx, ...) size or a raw tracking beside the fit", () => {
    expect(css).not.toMatch(/max\(\s*\d+px,\s*var\(--stage-mono-min/);
    for (const [name, body] of recipes) {
      if (!body.includes("--mono-s")) continue;
      expect(body, name).not.toMatch(/(?<![-\w])font-size:/);
      expect(body, name).not.toMatch(/letter-spacing:/);
    }
  });

  it("every recipe that declares --mono-s applies the fit, and declares --mono-t when it applies mono-fit", () => {
    const fitted = recipes.filter(([, body]) => body.includes("--mono-s"));
    expect(fitted.length).toBeGreaterThanOrEqual(18);
    for (const [name, body] of fitted) {
      expect(body, name).toMatch(/@apply mono-fit(-size)?;/);
      if (/@apply mono-fit;/.test(body)) expect(body, name).toContain("--mono-t");
    }
  });

  it("keeps the drawn width: tracking falls with the scale, between 0 and its own", () => {
    // The formula from mono-fit, evaluated here: S px drawn at tracking T em, floored to R = 11 / scale.
    const tracking = (s: number, t: number, scale: number) =>
      Math.max(0, Math.min(t, (s * (0.6 + t) * scale) / 11 - 0.6));
    const width = (s: number, t: number, scale: number) => {
      const r = Math.max(s, 11 / scale);
      return r * (0.6 + tracking(s, t, scale));
    };
    for (const [s, t] of [
      [11, 0.14],
      [11, 0.2],
      [12, 0.22],
      [14, 0.22],
    ] as const) {
      expect(tracking(s, t, 1)).toBeCloseTo(t, 10); // the artboard size: unchanged
      expect(tracking(s, t, 0.8)).toBeLessThanOrEqual(t);
      // A character is as wide as drawn; where the tracking has already run out (0) it is a hair wider.
      const drawn = s * (0.6 + t);
      if (tracking(s, t, 0.8) > 0) expect(width(s, t, 0.8)).toBeCloseTo(drawn, 6);
      else expect(width(s, t, 0.8)).toBeGreaterThanOrEqual(drawn);
    }
  });
});
