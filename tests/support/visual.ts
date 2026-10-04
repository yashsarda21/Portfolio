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

function missingReference(path: string): Error {
  return new Error(`Missing reference ${path}. Run \`pnpm references\` first.`);
}

async function readFileOrHint(path: string): Promise<Buffer> {
  try {
    return await readFile(path);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") throw missingReference(path);
    throw err;
  }
}

export async function readReference(artboard: string, width: number, height: number): Promise<PNG> {
  return PNG.sync.read(await readFileOrHint(referencePath(artboard, width, height)));
}

/** Element boxes (CSS px) the renderer recorded for a fluid board. */
export async function readRegions(
  artboard: string,
  width: number,
  height: number,
): Promise<Record<string, Rect>> {
  const path = referencePath(artboard, width, height).replace(/\.png$/, ".regions.json");
  return JSON.parse((await readFileOrHint(path)).toString("utf8")) as Record<string, Rect>;
}

/** Copy a window out of an image. The rect is rounded to whole pixels and clamped to the bounds. */
export function cropPng(src: PNG, r: Rect): PNG {
  const x0 = Math.min(src.width, Math.max(0, Math.round(r.x)));
  const y0 = Math.min(src.height, Math.max(0, Math.round(r.y)));
  const x1 = Math.min(src.width, Math.max(x0, Math.round(r.x + r.width)));
  const y1 = Math.min(src.height, Math.max(y0, Math.round(r.y + r.height)));
  const out = new PNG({ width: x1 - x0, height: y1 - y0 });
  for (let y = y0; y < y1; y++) {
    const from = (y * src.width + x0) * 4;
    src.data.copy(out.data, (y - y0) * out.width * 4, from, from + out.width * 4);
  }
  return out;
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

/** Paints mask rects magenta into BOTH inputs (mutates them) before diffing. */
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
  const expected = await readReference(artboard, viewport.width, viewport.height);
  await page.evaluate(() => document.fonts.ready);
  const actual = PNG.sync.read(await page.screenshot({ animations: "disabled", caret: "hide" }));

  const rects: Rect[] = [...(options.maskRects ?? [])];
  for (const locator of options.mask ?? []) {
    const box = await locator.boundingBox();
    if (box) rects.push(box);
  }

  const { ratio, diff } = diffImages(actual, expected, rects, options.threshold);
  const max = options.maxDiffRatio ?? 0.02;
  if (process.env.LOG_RATIOS)
    console.log(`[ratio] ${artboard}@${viewport.width}x${viewport.height} ${ratio}`);
  if (ratio > max || process.env.LOG_RATIOS) {
    const dir = join(process.cwd(), "test-results/visual");
    await mkdir(dir, { recursive: true });
    const base = join(dir, `${artboard}@${viewport.width}x${viewport.height}`);
    await writeFile(`${base}.actual.png`, PNG.sync.write(actual));
    await writeFile(`${base}.expected.png`, PNG.sync.write(expected));
    await writeFile(`${base}.diff.png`, PNG.sync.write(diff));
    if (ratio <= max) return ratio; // LOG_RATIOS: keep the images of a passing run too
    throw new Error(
      `${artboard}: ${(ratio * 100).toFixed(2)}% of pixels differ (limit ${(max * 100).toFixed(2)}%). ` +
        `See ${base}.diff.png`,
    );
  }
  return ratio;
}

/**
 * Compare named boxes (CSS px on the board) of two same-size images, each with its own ratio.
 * Pure: the diff images are not written. Used where a page differs from its board on purpose (a logged
 * deviation, spec §11) and the rest of it must still match: the boxes are the parts that must.
 */
export function diffBoxes(
  actual: PNG,
  expected: PNG,
  boxes: Record<string, Rect>,
  threshold = 0.1,
): Record<string, number> {
  const ratios: Record<string, number> = {};
  for (const [name, box] of Object.entries(boxes)) {
    ratios[name] = diffImages(cropPng(actual, box), cropPng(expected, box), [], threshold).ratio;
  }
  return ratios;
}

export interface BoxMatchOptions {
  /** Largest allowed share of differing pixels in each box (default 0.02, spec §9.1). */
  maxDiffRatio?: number;
  threshold?: number;
}

/** Screenshot the page and compare only the named boxes with the same boxes of the artboard reference. */
export async function expectBoxesMatchArtboard(
  page: Page,
  artboard: string,
  boxes: Record<string, Rect>,
  options: BoxMatchOptions = {},
): Promise<Record<string, number>> {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("expectBoxesMatchArtboard needs a fixed viewport");
  const expected = await readReference(artboard, viewport.width, viewport.height);
  await page.evaluate(() => document.fonts.ready);
  const actual = PNG.sync.read(await page.screenshot({ animations: "disabled", caret: "hide" }));
  const ratios = diffBoxes(actual, expected, boxes, options.threshold);
  const max = options.maxDiffRatio ?? 0.02;
  if (process.env.LOG_RATIOS) console.log(`[ratio] ${artboard} boxes`, JSON.stringify(ratios));
  const over = Object.entries(ratios).filter(([, ratio]) => ratio > max);
  if (over.length > 0) {
    const dir = join(process.cwd(), "test-results/visual");
    await mkdir(dir, { recursive: true });
    const base = join(dir, `${artboard}@${viewport.width}x${viewport.height}-boxes`);
    await writeFile(`${base}.actual.png`, PNG.sync.write(actual));
    await writeFile(`${base}.expected.png`, PNG.sync.write(expected));
    throw new Error(
      `${artboard}: ` +
        over.map(([name, r]) => `${name} ${(r * 100).toFixed(2)}%`).join(", ") +
        ` of pixels differ (limit ${(max * 100).toFixed(2)}%). See ${base}.actual.png`,
    );
  }
  return ratios;
}

export interface RegionMatchOptions {
  /** Size of the reference board, e.g. { width: 1440, height: 3300 } (default: page viewport). */
  reference?: { width: number; height: number };
  maxDiffRatio?: number; // default 0.02
  /** Regions to exclude, in CSS px relative to the region's top-left. */
  maskRects?: Rect[];
  threshold?: number;
}

/** Screenshot one element and compare it with the same region cropped out of the artboard reference. */
export async function expectRegionMatchesArtboard(
  actual: Locator,
  artboard: string,
  region: string,
  options: RegionMatchOptions = {},
): Promise<number> {
  const page = actual.page();
  const ref = options.reference ?? page.viewportSize();
  if (!ref)
    throw new Error("expectRegionMatchesArtboard needs a fixed viewport or a reference size");

  const regions = await readRegions(artboard, ref.width, ref.height);
  const box = regions[region];
  if (!box) {
    throw new Error(
      `${artboard} has no region "${region}". Available: ${Object.keys(regions).join(", ")}`,
    );
  }
  let expected: PNG = cropPng(await readReference(artboard, ref.width, ref.height), box);

  await page.evaluate(() => document.fonts.ready);
  // Clip the page ourselves, rounding the box exactly as cropPng does for the reference. A plain
  // element screenshot floors a fractional top edge (702.98 -> 702) while the reference crop rounds it
  // (-> 703), which shifts every edge in the region by a pixel.
  const live = await actual.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height };
  });
  const x0 = Math.max(0, Math.round(live.x));
  const y0 = Math.max(0, Math.round(live.y));
  const clip = {
    x: x0,
    y: y0,
    width: Math.max(1, Math.round(live.x + live.width) - x0),
    height: Math.max(1, Math.round(live.y + live.height) - y0),
  };
  let actualPng: PNG = PNG.sync.read(
    await page.screenshot({ clip, fullPage: true, animations: "disabled", caret: "hide" }),
  );

  // Sub-pixel rounding can leave the two a pixel or two apart: compare the shared area.
  const dw = Math.abs(actualPng.width - expected.width);
  const dh = Math.abs(actualPng.height - expected.height);
  if (dw > 2 || dh > 2) {
    throw new Error(
      `${artboard}/${region}: size ${actualPng.width}x${actualPng.height} vs reference ` +
        `${expected.width}x${expected.height} (layout differs)`,
    );
  }
  if (dw > 0 || dh > 0) {
    const shared = {
      x: 0,
      y: 0,
      width: Math.min(actualPng.width, expected.width),
      height: Math.min(actualPng.height, expected.height),
    };
    actualPng = cropPng(actualPng, shared);
    expected = cropPng(expected, shared);
  }

  const { ratio, diff } = diffImages(
    actualPng,
    expected,
    options.maskRects ?? [],
    options.threshold,
  );
  const max = options.maxDiffRatio ?? 0.02;
  if (ratio > max || process.env.LOG_RATIOS) {
    const dir = join(process.cwd(), "test-results/visual");
    await mkdir(dir, { recursive: true });
    const base = join(dir, `${artboard}-${region}`);
    await writeFile(`${base}.actual.png`, PNG.sync.write(actualPng));
    await writeFile(`${base}.expected.png`, PNG.sync.write(expected));
    await writeFile(`${base}.diff.png`, PNG.sync.write(diff));
    if (ratio <= max) return ratio;
    throw new Error(
      `${artboard}/${region}: ${(ratio * 100).toFixed(2)}% of pixels differ (limit ${(max * 100).toFixed(2)}%). ` +
        `See ${base}.diff.png`,
    );
  }
  return ratio;
}
