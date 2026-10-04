#!/usr/bin/env node
/* global document, window -- referenced inside page.evaluate(), which runs in the browser */
// Renders every handoff artboard to a PNG reference (spec §9.3).
// Usage: pnpm references            → all boards
//        pnpm references Main Hub   → only these
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SOURCE = join(ROOT, "design/handoff/design-source");
const ASSETS = join(ROOT, "design/handoff/assets");
const OUT = join(ROOT, "design/references");
const RUNTIME = join(ROOT, "tools/render-artboards/runtime.js");

// Canvas blob IDs → handoff assets (audit §10 #5). The resume PDF blob is deliberately not served.
const BLOBS = {
  ce44ebfed8ad9979086b96c681c1f133: "character-rig/turn_0.webp",
  ec1dd1224b94231a919a24552cd472bc: "character-rig/turn_1.webp",
  "830b24f7277c2c75359b074fc3c52669": "character-rig/turn_2.webp",
  f8a90aea8f1ad9cd7e8273aa370812df: "character-rig/rest.webp",
};

// Short pause after animations are settled, before the screenshot.
const SETTLE_MS = 300;

// Only these directories (and the runtime stand-in) may be served.
const SERVED_DIRS = [SOURCE, ASSETS, join(ROOT, "node_modules/@fontsource")];

const FONTS = [
  ["Big Shoulders Display", "big-shoulders-display", [700, 800, 900], ["normal"]],
  ["Archivo", "archivo", [400, 500, 600, 700], ["normal", "italic"]],
  ["JetBrains Mono", "jetbrains-mono", [400, 700], ["normal"]],
];

// Element boxes for fluid boards, so tests can compare one region at a time (tall pages shift when content differs).
const REGIONS = {
  QuickView: {
    header: "header",
    hero: "main > section:nth-of-type(1)",
    heroCtas: "main > section:nth-of-type(1) > div:last-child",
    careerHead: "#career > div:first-child",
    highlightsHead: "#highlights > div:first-child",
    highlights: "#highlights",
    attributes: "#attributes",
    trophiesHead: "#trophies > div:nth-child(1) > h2",
    academyHead: "#trophies > div:nth-child(2) > h2",
    teamup: "#teamup",
    teamupResume: "#teamup a:last-child",
    footer: "footer",
  },
};

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

// Transitions jump straight to their end state. Animations are settled with the Web Animations API instead.
const FREEZE = "*,*::before,*::after{transition:none!important}";

function fontCss(origin) {
  const faces = [];
  for (const [family, pkg, weights, styles] of FONTS) {
    for (const weight of weights) {
      for (const style of styles) {
        if (style === "italic" && weight > 500) continue;
        faces.push(
          `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};font-display:block;` +
            `src:url(${origin}/__fonts/${pkg}/files/${pkg}-latin-${weight}-${style}.woff2) format('woff2');}`,
        );
      }
    }
  }
  return faces.join("\n");
}

function fileFor(pathname) {
  if (pathname === "/support.js") return RUNTIME;
  let target;
  if (pathname.startsWith("/_blob/")) {
    const asset = BLOBS[pathname.slice("/_blob/".length)];
    if (!asset) return null;
    target = join(ASSETS, asset);
  } else if (pathname.startsWith("/__fonts/")) {
    target = resolve(ROOT, "node_modules/@fontsource", pathname.slice("/__fonts/".length));
  } else {
    let decoded;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      return null;
    }
    target = resolve(SOURCE, "." + decoded);
  }
  target = resolve(target);
  return SERVED_DIRS.some((dir) => target.startsWith(dir + sep)) ? target : null;
}

function startServer() {
  return new Promise((resolveServer) => {
    const server = createServer(async (req, res) => {
      const file = fileFor(new URL(req.url ?? "/", "http://x").pathname);
      if (!file || !existsSync(file)) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
      res.end(await readFile(file));
    });
    server.listen(0, "127.0.0.1", () => resolveServer(server));
  });
}

const canvas = JSON.parse(await readFile(join(SOURCE, "canvas.json"), "utf8"));
const only = process.argv.slice(2);
await mkdir(OUT, { recursive: true });
const server = await startServer();
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let failures = 0;

for (const [file, board] of Object.entries(canvas.boards)) {
  const name = file.replace(".dc.html", "");
  if (only.length > 0 && !only.includes(name)) continue;
  const page = await browser.newPage({
    viewport: { width: board.w, height: board.h },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: fontCss(origin) }),
  );
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());
  try {
    await page.goto(`${origin}/${file}`, { waitUntil: "load" });
    await page.waitForSelector("html[data-dc-ready]", { timeout: 10_000 });
    await page.addStyleTag({ content: FREEZE });
    await page.evaluate(() => document.fonts.ready);
    // Looping animations rest at their first frame (authored look); finite ones jump to their end.
    await page.evaluate(() => {
      for (const a of document.getAnimations()) {
        if (a.effect.getComputedTiming().iterations === Infinity) {
          a.pause();
          a.currentTime = 0;
        } else {
          a.finish();
        }
      }
    });
    await page.waitForTimeout(SETTLE_MS);
    const out = join(OUT, `${name}@${board.w}x${board.h}.png`);
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: board.w, height: board.h } });
    const regions = REGIONS[name];
    if (regions) {
      const boxes = await page.evaluate((selectors) => {
        const result = {};
        for (const [key, selector] of Object.entries(selectors)) {
          const el = document.querySelector(selector);
          if (!el) return { missing: `${key} (${selector})` };
          const r = el.getBoundingClientRect();
          result[key] = { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height };
        }
        return result;
      }, regions);
      if (boxes.missing) throw new Error(`region selector matched nothing: ${boxes.missing}`);
      for (const box of Object.values(boxes)) {
        for (const k of Object.keys(box)) box[k] = Math.round(box[k] * 100) / 100;
      }
      await writeFile(
        out.replace(/\.png$/, ".regions.json"),
        JSON.stringify(boxes, null, 2) + "\n",
      );
    }
    console.log(`✓ ${name} → ${out}`);
  } catch (err) {
    failures += 1;
    console.error(`✗ ${name}: ${err instanceof Error ? err.message : String(err)}`);
  }
  await page.close();
}

await browser.close();
server.close();
if (failures > 0) process.exitCode = 1;
