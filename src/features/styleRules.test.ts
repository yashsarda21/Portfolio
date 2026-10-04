import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Features describe what is on a page; the design system decides how it sits. Pixel fitting (the font's
 * own line box, content-box heights, a tracking override, a recipe swapped at a breakpoint) lives in
 * recipes and components, reached through typed props: `leading="font"`, `caps`, `<PanelHeader>`,
 * `<Chip size>`, a recipe with its own `@media` step. This guard fails the build if a class that does it
 * by hand shows up in `src/features`.
 */
const RULES: { name: string; pattern: RegExp; use: string }[] = [
  { name: "leading-*", pattern: /(?:^|[^\w-])leading-/, use: 'the typed `leading="font"` prop' },
  { name: "tracking-[…]", pattern: /(?:^|[^\w-])tracking-\[/, use: "a type recipe" },
  {
    name: "box-content",
    pattern: /(?:^|[^\w-])box-content\b/,
    use: "a design-system component (PanelHeader, Chip, …)",
  },
  {
    name: "uppercase",
    pattern: /(?:^|[^\w-])uppercase\b/,
    use: "the typed `caps` prop, or a recipe that is already uppercase",
  },
  {
    name: "a type recipe behind a breakpoint",
    pattern: /(?:^|[\s"'`])(?:(?:max|min)-(?:sm|md|lg|xl|2xl|\[[^\]\s]+\])|sm|md|lg|xl|2xl):type-/,
    use: "a recipe with its own @media step in base.css",
  },
];

const FEATURES = join(process.cwd(), "src/features");

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sources(path);
    const isCode = /\.tsx?$/.test(entry);
    const isTestOrStory = /\.(test|stories)\.tsx?$/.test(entry) || /\.fixture\.tsx?$/.test(entry);
    return isCode && !isTestOrStory ? [path] : [];
  });
}

/** Comments may talk about these classes; only real code counts. */
const withoutComments = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("feature code leaves pixel fitting to the design system", () => {
  it("scans the feature files", () => {
    expect(sources(FEATURES).length).toBeGreaterThan(10);
  });

  it.each(RULES)("no $name in src/features (use $use)", ({ pattern }) => {
    const offenders = sources(FEATURES)
      .filter((file) => pattern.test(withoutComments(readFileSync(file, "utf8"))))
      .map((file) => relative(process.cwd(), file));
    expect(offenders).toEqual([]);
  });

  describe("the rules themselves", () => {
    const hits = (name: string, text: string) =>
      RULES.find((r) => r.name === name)!.pattern.test(text);

    it("catch the classes they are named for", () => {
      expect(hits("leading-*", 'className="type-d3 leading-auto"')).toBe(true);
      expect(hits("leading-*", '"leading-tight"')).toBe(true);
      expect(hits("tracking-[…]", "tracking-[wide]")).toBe(true);
      expect(hits("box-content", "box-content h-12")).toBe(true);
      expect(hits("uppercase", '"text-right uppercase"')).toBe(true);
      expect(hits("a type recipe behind a breakpoint", "max-md:type-d3s")).toBe(true);
      expect(hits("a type recipe behind a breakpoint", "md:type-body-sm")).toBe(true);
      expect(hits("a type recipe behind a breakpoint", "min-[1200px]:type-d2")).toBe(true);
    });

    it("leave the typed props and layout classes alone", () => {
      expect(hits("leading-*", 'leading="font"')).toBe(false);
      expect(hits("a type recipe behind a breakpoint", "max-md:hidden type-d3")).toBe(false);
      expect(hits("a type recipe behind a breakpoint", "type-body-sm md:hidden")).toBe(false);
      expect(hits("uppercase", 'variant="mono-label" caps')).toBe(false);
    });
  });
});
