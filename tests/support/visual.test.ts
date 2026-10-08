import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { cropPng, diffBoxes, diffImages, readReference, readRegions } from "./visual";

function solid(width: number, height: number, rgb: [number, number, number]): PNG {
  const png = new PNG({ width, height });
  for (let i = 0; i < width * height; i++) {
    png.data[i * 4] = rgb[0];
    png.data[i * 4 + 1] = rgb[1];
    png.data[i * 4 + 2] = rgb[2];
    png.data[i * 4 + 3] = 255;
  }
  return png;
}

function paintBlock(png: PNG, x0: number, y0: number, size: number, rgb: [number, number, number]) {
  for (let y = y0; y < y0 + size; y++) {
    for (let x = x0; x < x0 + size; x++) {
      const i = (y * png.width + x) * 4;
      png.data[i] = rgb[0];
      png.data[i + 1] = rgb[1];
      png.data[i + 2] = rgb[2];
    }
  }
}

describe("diffImages", () => {
  it("reports zero for identical images", () => {
    expect(diffImages(solid(100, 100, [5, 7, 10]), solid(100, 100, [5, 7, 10]), []).ratio).toBe(0);
  });

  it("reports the share of differing pixels", () => {
    const actual = solid(100, 100, [5, 7, 10]);
    paintBlock(actual, 0, 0, 10, [215, 255, 63]);
    expect(diffImages(actual, solid(100, 100, [5, 7, 10]), []).ratio).toBeCloseTo(0.01, 5);
  });

  it("ignores masked regions in both images", () => {
    const actual = solid(100, 100, [5, 7, 10]);
    paintBlock(actual, 0, 0, 10, [215, 255, 63]);
    const rects = [{ x: 0, y: 0, width: 10, height: 10 }];
    expect(diffImages(actual, solid(100, 100, [5, 7, 10]), rects).ratio).toBe(0);
  });

  it("throws on size mismatch", () => {
    expect(() => diffImages(solid(10, 10, [0, 0, 0]), solid(20, 10, [0, 0, 0]), [])).toThrow(
      /Size mismatch/,
    );
  });
});

describe("diffBoxes", () => {
  it("gives each box its own ratio and ignores what lies outside the boxes", () => {
    const actual = solid(100, 100, [5, 7, 10]);
    paintBlock(actual, 0, 0, 10, [215, 255, 63]); // inside "a": 10x10 of 20x20 box = 25%
    paintBlock(actual, 60, 60, 10, [215, 255, 63]); // outside every box
    const ratios = diffBoxes(actual, solid(100, 100, [5, 7, 10]), {
      a: { x: 0, y: 0, width: 20, height: 20 },
      b: { x: 30, y: 30, width: 20, height: 20 },
    });
    expect(ratios.a).toBeCloseTo(0.25, 5);
    expect(ratios.b).toBe(0);
  });
});

describe("diffBoxes, a box that moved", () => {
  const box = { x: 10, y: 10, width: 20, height: 20 };
  const blank = () => solid(100, 100, [5, 7, 10]);

  it("compares the page's box at its new position with the board's at the old one", () => {
    const expected = blank();
    paintBlock(expected, 12, 12, 8, [215, 255, 63]);
    const actual = blank();
    paintBlock(actual, 12, 52, 8, [215, 255, 63]); // the same block, 40px lower
    expect(diffBoxes(actual, expected, { cta: box }).cta).toBeGreaterThan(0);
    expect(diffBoxes(actual, expected, { cta: box }, 0.1, { cta: { x: 10, y: 50 } }).cta).toBe(0);
  });

  it("still sees a real difference at the new position", () => {
    const expected = blank();
    paintBlock(expected, 12, 12, 8, [215, 255, 63]);
    const actual = blank();
    paintBlock(actual, 12, 52, 8, [215, 255, 63]);
    paintBlock(actual, 22, 62, 4, [255, 0, 0]);
    const ratio = diffBoxes(actual, expected, { cta: box }, 0.1, { cta: { x: 10, y: 50 } }).cta;
    expect(ratio).toBeCloseTo(16 / 400, 5);
  });

  it("rounds a fractional position to whole pixels and leaves unplaced boxes where they are", () => {
    const expected = blank();
    paintBlock(expected, 12, 12, 8, [215, 255, 63]);
    const actual = blank();
    paintBlock(actual, 12, 52, 8, [215, 255, 63]);
    paintBlock(actual, 12, 12, 8, [215, 255, 63]);
    const ratios = diffBoxes(actual, expected, { moved: box, still: box }, 0.1, {
      moved: { x: 10.2, y: 49.6 },
    });
    expect(ratios.moved).toBe(0);
    expect(ratios.still).toBe(0);
  });

  it("masks are relative to each box and cover both crops", () => {
    const expected = blank();
    const actual = blank();
    paintBlock(actual, 12, 52, 8, [215, 255, 63]); // only the page has it
    const placements = { cta: { x: 10, y: 50 } };
    expect(diffBoxes(actual, expected, { cta: box }, 0.1, placements).cta).toBeGreaterThan(0);
    const masks = { cta: [{ x: 0, y: 0, width: 12, height: 12 }] };
    expect(diffBoxes(actual, expected, { cta: box }, 0.1, placements, masks).cta).toBe(0);
  });
});

describe("cropPng", () => {
  it("returns the exact pixels of a window", () => {
    const src = new PNG({ width: 4, height: 4 });
    for (let i = 0; i < 16; i++) {
      src.data[i * 4] = i * 10;
      src.data[i * 4 + 3] = 255;
    }
    const out = cropPng(src, { x: 1, y: 1, width: 2, height: 2 });
    expect([out.width, out.height]).toEqual([2, 2]);
    // source pixels 5, 6, 9, 10
    expect([0, 1, 2, 3].map((i) => out.data[i * 4])).toEqual([50, 60, 90, 100]);
  });

  it("clamps to the image bounds", () => {
    const out = cropPng(solid(4, 4, [1, 2, 3]), { x: 3, y: 3, width: 5, height: 5 });
    expect([out.width, out.height]).toEqual([1, 1]);
  });
});

describe("missing references", () => {
  it("readReference points at pnpm references", async () => {
    await expect(readReference("Nope", 1, 1)).rejects.toThrow("Run `pnpm references`");
  });

  it("readRegions points at pnpm references", async () => {
    await expect(readRegions("Nope", 1, 1)).rejects.toThrow("Run `pnpm references`");
  });
});
