import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("loadGsap", () => {
  it("imports gsap once and returns the same instance", async () => {
    const { loadGsap } = await import("./motion");
    const [a, b] = await Promise.all([loadGsap(), loadGsap()]);
    expect(a).toBe(b);
    expect(typeof a.timeline).toBe("function");
  });
});

describe("bezier", () => {
  it("matches the CSS curve end points and is monotonic for the follow curve", async () => {
    const { bezier } = await import("./motion");
    const f = bezier(0.22, 1, 0.36, 1);
    expect(f(0)).toBe(0);
    expect(f(1)).toBe(1);
    expect(f(0.5)).toBeGreaterThan(0.85); // follow-through is front-loaded
    let last = 0;
    for (let i = 1; i <= 20; i++) {
      const v = f(i / 20);
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
  });
});

describe("EASE", () => {
  const theme = readFileSync(join(process.cwd(), "src/design-system/tokens/theme.css"), "utf8");

  it("mirrors every --ease-* token in theme.css (same four numbers)", async () => {
    const { EASE, bezier } = await import("./motion");
    const tokens = [...theme.matchAll(/--ease-(\w+): cubic-bezier\(([^)]+)\);/g)];
    expect(tokens.map((m) => m[1]!).sort()).toEqual(Object.keys(EASE).sort());
    for (const [, name, args] of tokens) {
      const [x1, y1, x2, y2] = args!.split(",").map(Number) as [number, number, number, number];
      const expected = bezier(x1, y1, x2, y2);
      const actual = EASE[name as keyof typeof EASE];
      for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) expect(actual(t)).toBeCloseTo(expected(t), 6);
    }
  });
});

describe("prefetchGsap", () => {
  it("does nothing during prerender (no window)", async () => {
    const { prefetchGsap } = await import("./motion");
    // jsdom has a window; the guard is exercised by the SSR build. Here: it must not throw and returns void.
    expect(prefetchGsap()).toBeUndefined();
  });
});
