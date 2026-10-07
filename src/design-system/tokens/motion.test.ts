import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dir = join(process.cwd(), "src/design-system/tokens");
const read = (f: string) => readFileSync(join(dir, f), "utf8");
const motion = read("motion.css");
const scene = read("scene.css");

/** The body of `@keyframes name { ... }` (balanced braces). */
function keyframes(css: string, name: string): string {
  const start = css.indexOf(`@keyframes ${name} {`);
  if (start < 0) throw new Error(`@keyframes ${name} not found`);
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(start, i + 1);
  }
  throw new Error(`@keyframes ${name} unbalanced`);
}

describe("entrance presets never leave a hidden part focusable", () => {
  it.each([
    ["fade-in", motion, "from"],
    ["rise-in", motion, "from"],
    ["boot-name", motion, "0%"],
    ["boot-scan", motion, "0%"],
    ["bank-flicker", scene, "0%"],
  ])("%s: its first frame is visibility: hidden", (name, css, first) => {
    const body = keyframes(css, name);
    const frame = new RegExp(`${first}\\s*\\{[^}]*visibility:\\s*hidden`);
    expect(body).toMatch(frame);
  });
});

describe("boot presets run on the page's pace", () => {
  it.each(["animate-boot-fade", "animate-boot-rise", "animate-boot-name", "animate-boot-scan"])(
    "%s multiplies its duration and delay by --pace and reads --d",
    (name) => {
      const block = motion.slice(motion.indexOf(`@utility ${name} {`));
      const body = block.slice(0, block.indexOf("\n}"));
      expect(body).toMatch(/animation:[^;]*calc\([^;]*var\(--pace, 1\)/);
      expect(body).toMatch(/animation-delay:\s*calc\(var\(--d, 0s\) \* var\(--pace, 1\)\)/);
    },
  );

  it("a return visit runs at a quarter of the time", () => {
    expect(motion).toMatch(/:root\[data-return-visit\]\s*\{\s*--pace:\s*0?\.25;/);
  });

  it("the bank flicker keeps one definition and reads --d and --pace", () => {
    expect(scene.match(/@keyframes bank-flicker/g)).toHaveLength(1);
    expect(motion).not.toContain("@keyframes bank-flicker");
    const block = scene.slice(scene.indexOf("@utility animate-bank-flicker {"));
    expect(block.slice(0, block.indexOf("\n}"))).toMatch(/var\(--d, 0s\) \* var\(--pace, 1\)/);
    expect(scene).not.toContain("--flicker-delay");
  });
});

describe("idle loops are off under reduced motion", () => {
  it.each(["animate-breathe", "animate-face-sweep"])("%s", (name) => {
    const block = motion.slice(motion.indexOf(`@utility ${name} {`));
    expect(block.slice(0, block.indexOf("\n}\n"))).toMatch(
      /prefers-reduced-motion: reduce\)\s*\{[^}]*animation:\s*none/,
    );
  });
});
