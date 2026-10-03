#!/usr/bin/env node
/* global document -- referenced inside page.evaluate(), which runs in the browser */
// Renders every handoff artboard to a PNG reference (spec §9.3).
// Usage: pnpm references            → all boards
//        pnpm references Main Hub   → only these
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
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

// Boards driven by JS timelines need time to reach their final frame.
const SETTLE_MS = { "Intro.dc.html": 7000 };

const FONTS = [
  ["Big Shoulders Display", "big-shoulders-display", [700, 800, 900], ["normal"]],
  ["Archivo", "archivo", [400, 500, 600, 700], ["normal", "italic"]],
  ["JetBrains Mono", "jetbrains-mono", [400, 700], ["normal"]],
];

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

// Force every CSS animation/transition to its end state.
const FREEZE =
  "*,*::before,*::after{animation-delay:0s!important;animation-duration:1ms!important;" +
  "animation-iteration-count:1!important;transition:none!important}";

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
  if (pathname.startsWith("/_blob/")) {
    const asset = BLOBS[pathname.slice("/_blob/".length)];
    return asset ? join(ASSETS, asset) : null;
  }
  if (pathname.startsWith("/__fonts/")) {
    const [pkg, ...rest] = pathname.slice("/__fonts/".length).split("/");
    return join(ROOT, "node_modules/@fontsource", pkg, ...rest);
  }
  return join(SOURCE, decodeURIComponent(pathname));
}

function startServer() {
  return new Promise((resolveServer) => {
    const server = createServer(async (req, res) => {
      const file = fileFor(new URL(req.url ?? "/", "http://x").pathname);
      if (!file || !file.startsWith(ROOT) || !existsSync(file)) {
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
    await page.waitForTimeout(SETTLE_MS[file] ?? 300);
    const out = join(OUT, `${name}@${board.w}x${board.h}.png`);
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: board.w, height: board.h } });
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
