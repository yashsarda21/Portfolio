import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { diffImages } from "./visual";

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
