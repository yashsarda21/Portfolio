import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Locator, Page } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ArtboardMatchOptions {
  /** Largest allowed share of differing pixels (0.02 = 2%, spec §9.1). */
  maxDiffRatio?: number;
  /** Elements to exclude (logged deviations, spec §11). */
  mask?: Locator[];
  /** Raw regions to exclude, in CSS pixels. */
  maskRects?: Rect[];
  /** pixelmatch colour threshold 0–1 (default 0.1). */
  threshold?: number;
}

const REFERENCES_DIR = join(process.cwd(), "design/references");

export function referencePath(artboard: string, width: number, height: number): string {
  return join(REFERENCES_DIR, `${artboard}@${width}x${height}.png`);
}

function paintRects(png: PNG, rects: Rect[]): void {
  for (const r of rects) {
    const x0 = Math.max(0, Math.floor(r.x));
    const y0 = Math.max(0, Math.floor(r.y));
    const x1 = Math.min(png.width, Math.ceil(r.x + r.width));
    const y1 = Math.min(png.height, Math.ceil(r.y + r.height));
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * png.width + x) * 4;
        png.data[i] = 255;
        png.data[i + 1] = 0;
        png.data[i + 2] = 255;
        png.data[i + 3] = 255;
      }
    }
  }
}

export function diffImages(actual: PNG, expected: PNG, rects: Rect[], threshold = 0.1) {
  if (actual.width !== expected.width || actual.height !== expected.height) {
    throw new Error(
      `Size mismatch: actual ${actual.width}x${actual.height}, reference ${expected.width}x${expected.height}`,
    );
  }
  paintRects(actual, rects);
  paintRects(expected, rects);
  const diff = new PNG({ width: actual.width, height: actual.height });
  const pixels = pixelmatch(actual.data, expected.data, diff.data, actual.width, actual.height, {
    threshold,
  });
  return { ratio: pixels / (actual.width * actual.height), pixels, diff };
}

/** Screenshot the page and compare it with the artboard reference at the same viewport size. */
export async function expectMatchesArtboard(
  page: Page,
  artboard: string,
  options: ArtboardMatchOptions = {},
): Promise<number> {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("expectMatchesArtboard needs a fixed viewport");
  const expected = PNG.sync.read(
    await readFile(referencePath(artboard, viewport.width, viewport.height)),
  );
  await page.evaluate(() => document.fonts.ready);
  const actual = PNG.sync.read(await page.screenshot({ animations: "disabled", caret: "hide" }));

  const rects: Rect[] = [...(options.maskRects ?? [])];
  for (const locator of options.mask ?? []) {
    const box = await locator.boundingBox();
    if (box) rects.push(box);
  }

  const { ratio, diff } = diffImages(actual, expected, rects, options.threshold);
  const max = options.maxDiffRatio ?? 0.02;
  if (ratio > max) {
    const dir = join(process.cwd(), "test-results/visual");
    await mkdir(dir, { recursive: true });
    const base = join(dir, `${artboard}@${viewport.width}x${viewport.height}`);
    await writeFile(`${base}.actual.png`, PNG.sync.write(actual));
    await writeFile(`${base}.expected.png`, PNG.sync.write(expected));
    await writeFile(`${base}.diff.png`, PNG.sync.write(diff));
    throw new Error(
      `${artboard}: ${(ratio * 100).toFixed(2)}% of pixels differ (limit ${(max * 100).toFixed(2)}%). ` +
        `See ${base}.diff.png`,
    );
  }
  return ratio;
}
