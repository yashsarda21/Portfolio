import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { apexOf, CONE_APEX, CONE_REGIONS, polygonIn } from "./cones";

const scene = readFileSync(join(process.cwd(), "src/design-system/tokens/scene.css"), "utf8");

/** The two numbers after `prefix` in a CSS block: `var(--cone-apex-a, 6.9231%)` or `--cone-apex-a: 7.4074%`. */
function apexIn(block: string, form: "default" | "override"): [number, number] {
  const re =
    form === "default"
      ? /--cone-apex-a, ([\d.]+)%[\s\S]*?--cone-apex-b, ([\d.]+)%/
      : /--cone-apex-a: ([\d.]+)%;\s*--cone-apex-b: ([\d.]+)%/;
  const m = block.match(re);
  if (!m) throw new Error(`no apex numbers in: ${block}`);
  return [Number(m[1]), Number(m[2])];
}
const utility = (name: string) => scene.slice(scene.indexOf(`@utility ${name} {`)).split("\n}")[0]!;
const override = (layout: string, part: string) =>
  scene.slice(scene.indexOf(`[data-layout="${layout}"] [data-part="${part}"] {`)).split("}")[0]!;

describe("apexOf", () => {
  it("covers exactly the lamp: (lamp - box.x) / box.w in percent, 4 places", () => {
    expect(apexOf({ x: 60, y: 0, w: 520, h: 1 }, [96, 208])).toEqual([6.9231, 28.4615]);
  });
});

describe("scene.css carries the cone apex that cones.ts computes (D-1)", () => {
  it("landing: the scene-cone-left / -right defaults", () => {
    expect(apexIn(utility("scene-cone-left"), "default")).toEqual(CONE_APEX.landing.left);
    expect(apexIn(utility("scene-cone-right"), "default")).toEqual(CONE_APEX.landing.right);
  });
  it("intro: the data-layout overrides", () => {
    expect(apexIn(override("intro", "cone-left"), "override")).toEqual(CONE_APEX.intro.left);
    expect(apexIn(override("intro", "cone-right"), "override")).toEqual(CONE_APEX.intro.right);
  });
});

describe("polygonIn", () => {
  it("maps a clip-path polygon (percent of its box) into fractions of the 1440x900 canvas", () => {
    const poly = polygonIn({ x: 60, y: 70, w: 520, h: 760 }, [
      [0, 0],
      [100, 0],
      [100, 100],
    ]);
    expect(poly[0]).toEqual([60 / 1440, 70 / 900]);
    expect(poly[1]).toEqual([580 / 1440, 70 / 900]);
    expect(poly[2]).toEqual([580 / 1440, 830 / 900]);
  });
});

describe("CONE_REGIONS", () => {
  it("each layout has a left and a right cone, every point inside the canvas", () => {
    for (const layout of ["landing", "intro"] as const) {
      expect(CONE_REGIONS[layout]).toHaveLength(2);
      for (const poly of CONE_REGIONS[layout]) {
        expect(poly).toHaveLength(4);
        for (const [x, y] of poly) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(1);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});
