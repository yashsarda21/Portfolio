#!/usr/bin/env node
/* global document, Image -- used inside page.evaluate, which runs in the browser */
// Makes the share image, public/og.png (1200x630): the portrait on the arena's dark ground under a volt
// spotlight, with the name, the role line and "THE ARENA". Playwright's Chromium renders an HTML card, so the
// colours come from the design tokens and the type is the self-hosted fonts. Run once (`pnpm og-image`) and
// commit the PNG; the build does not make it.
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public/og.png");
const W = 1200;
const H = 630;
const PORTRAIT_H = Number(process.env.OG_H ?? 540);
const MAX_BYTES = 300 * 1024;
/** The portrait is drawn at this share of its size on the card and scaled up: a photo's fine grain is what makes a PNG heavy. */
const PORTRAIT_DETAIL = Number(process.env.OG_DETAIL ?? 0.5);

/** A `--ref-*` colour out of the token file (layer 1 holds the raw values). */
const tokens = readFileSync(join(ROOT, "src/design-system/tokens/tokens.css"), "utf8");
function token(name) {
  const match = tokens.match(new RegExp(`--ref-${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  if (!match) throw new Error(`token --ref-${name} not found`);
  return match[1];
}

const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(ROOT, `node_modules/@fontsource/${pkg}/files/${file}`)).toString("base64")}`;
const portrait = `data:image/png;base64,${readFileSync(join(ROOT, "design/handoff/assets/yash-portrait-cutout.png")).toString("base64")}`;

const { player } = JSON.parse(readFileSync(join(ROOT, "src/content/content.json"), "utf8"));
const wordmark = "THE ARENA"; // ui.brand.wordmark (src/content/ui-copy.ts)

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face { font-family: "Big Shoulders Display"; font-weight: 900; src: url(${font("big-shoulders-display", "big-shoulders-display-latin-900-normal.woff2")}); }
  @font-face { font-family: "JetBrains Mono"; font-weight: 700; src: url(${font("jetbrains-mono", "jetbrains-mono-latin-700-normal.woff2")}); }
  * { margin: 0; box-sizing: border-box; }
  body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${token("ground")}; position: relative; }
  /* The spotlight is a blurred flat ellipse, not a gradient: a gradient's dither noise makes the PNG twice the size. */
  .spot { position: absolute; border-radius: 50%; background: ${token("volt")}; filter: blur(90px); }
  .spot.a { left: 690px; top: 70px; width: 440px; height: 420px; opacity: 0.22; }
  .spot.b { left: 600px; top: 560px; width: 640px; height: 160px; opacity: 0.2; }
  .portrait { position: absolute; right: -20px; bottom: 0;
    -webkit-mask-image: linear-gradient(to right, transparent 0, #000 26%), linear-gradient(to top, transparent 0, #000 14%);
    -webkit-mask-composite: source-in; mask-composite: intersect; }
  .text { position: absolute; left: 72px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; gap: 22px; }
  .eyebrow { font: 700 26px "JetBrains Mono"; letter-spacing: 0.28em; color: ${token("volt")}; }
  .name { font: 900 188px/0.88 "Big Shoulders Display"; text-transform: uppercase; color: ${token("floodlight")}; }
  .role { font: 700 30px "JetBrains Mono"; letter-spacing: 0.16em; text-transform: uppercase; color: ${token("scout-grey")}; }
  .bar { width: 96px; height: 6px; background: ${token("volt")}; }
</style>
<div class="spot a"></div>
<div class="spot b"></div>
<canvas class="portrait"></canvas>
<div class="text">
  <div class="eyebrow">${wordmark}</div>
  <div class="bar"></div>
  <div class="name">${player.name.split(" ").join("<br>")}</div>
  <div class="role">${player.title}</div>
</div>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(
    async ({ src, detail, height }) => {
      await document.fonts.ready;
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.querySelector("canvas.portrait");
      const shownW = Math.round((height * img.naturalWidth) / img.naturalHeight);
      canvas.style.width = `${shownW}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.round(shownW * detail);
      canvas.height = Math.round(height * detail);
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    },
    { src: portrait, detail: PORTRAIT_DETAIL, height: PORTRAIT_H },
  );
  writeFileSync(OUT, await page.screenshot({ type: "png" }));
} finally {
  await browser.close();
}

const size = statSync(OUT).size;
console.log(`og-image: public/og.png written (${W}x${H}, ${(size / 1024).toFixed(0)} KB)`);
if (size > MAX_BYTES) {
  console.error(`og-image: over the ${MAX_BYTES / 1024} KB target`);
  process.exitCode = 1;
}
