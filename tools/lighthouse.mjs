#!/usr/bin/env node
// Lighthouse budget for the pages that carry a promise: the recruiter page (/scout), the Landing (/), the
// Player Intro (/intro), the Arena Hub (/arena), the three games (/arena/cricket, /tennis, /badminton) and Full Time (/arena/full-time). Not part of `pnpm verify` (slow): run it at a phase exit.
// Usage: pnpm build && pnpm lighthouse
// This script does not build: it reads whatever build/client holds. The SEO audit wants a canonical link, so build
// with the test address (as `pnpm verify` and the e2e web server do): VITE_SITE_URL=https://arena.example pnpm build
//
// Serves build/client on port 4174 (the user's `pnpm preview` on 4173 is left alone) with brotli-compressed
// text responses, like the production host, drives Playwright's Chromium through chrome-launcher, and fails
// unless the budget below is met. Phones (the default mobile profile) are gated at performance 0.8 wherever
// desktop performance is gated (the Landing: on its reduced-motion run). Every page prints one table:
// performance / accessibility / best practices / SEO, plus FCP, LCP, CLS and TBT from the audits.
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, constants as zlib } from "node:zlib";
import { chromium } from "@playwright/test";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BUILD = join(ROOT, "build/client");
const PORT = 4174;
const ORIGIN = `http://127.0.0.1:${PORT}`;

const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];
const RUNS = 3;

// Gates are minimums for the category scores (0-1) and, for the two timing audits, maximums in ms (FCP) or
// a unitless score (CLS). A variant without a gate for a metric only reports it.
const FRESH = { performance: 0.9, accessibility: 1, "best-practices": 0.9, seo: 0.9 };
const DESKTOP = { name: "desktop", config: desktopConfig };
const MOBILE = { name: "mobile", config: undefined };
// Phones (spec P7): a page whose desktop performance is gated also gates mobile performance at 80 (the
// phone profile is Lighthouse's default: a slow-4G network and a 4x slower CPU).
const PHONE_FLOOR = 0.8;
const MOBILE_FAST = { ...MOBILE, gate: { performance: PHONE_FLOOR } };
// Cricket and Tennis (owner decision, 2026-10-16): the gate measures the page's first load, as in every phase: the prerendered
// page and the 2D game it falls back to without WebGL. Headless Chrome on a machine with a GPU has WebGL2, so the
// gated runs switch it off (as the 2D e2e projects do). The 3D game is reported, never gated: the SwiftShader flags
// give headless Chrome a software WebGL, so the page loads its 3D scene, models and render loop. SwiftShader draws
// on the CPU, on the main thread's budget, so it overstates what a real device's GPU costs; Yash checks the 3D on
// his own phone instead.
const NO_3D = ["--disable-3d-apis"];
const SWIFTSHADER = ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"];

/**
 * The pages. Landing (spec 11.11, ruling L13): the full-motion run is reported for performance (the 3 s name
 * reveal is the largest paint by design) and gated on everything else; the reduced-motion run, which
 * measures the code's real cost, is where performance >= .9 is gated, and its phone run with reduced motion is gated at .8. The Intro gates everything but
 * performance. /scout: desktop in full, mobile accessibility and performance .8.
 */
const PAGES = [
  {
    path: "/scout",
    variants: [
      { ...DESKTOP, gate: FRESH },
      { ...MOBILE, gate: { accessibility: 1, performance: PHONE_FLOOR } },
    ],
  },
  {
    path: "/",
    variants: [
      {
        ...DESKTOP,
        gate: { accessibility: 1, "best-practices": 0.9, seo: 0.9, fcp: 1500, cls: 0.1 },
      },
      {
        ...DESKTOP,
        name: "desktop, reduced motion",
        chromeFlags: ["--force-prefers-reduced-motion"],
        gate: { ...FRESH, fcp: 1500, cls: 0.1 },
      },
      MOBILE,
      {
        ...MOBILE,
        name: "mobile, reduced motion",
        chromeFlags: ["--force-prefers-reduced-motion"],
        gate: { performance: PHONE_FLOOR },
      },
    ],
  },
  {
    path: "/intro",
    variants: [{ ...DESKTOP, gate: { accessibility: 1, "best-practices": 0.9, seo: 0.9 } }, MOBILE],
  },
  {
    // The Hub (spec 11.12, H15): a calm page with no long reveal, so desktop is gated in full.
    path: "/arena",
    variants: [{ ...DESKTOP, gate: { ...FRESH, fcp: 1500, cls: 0.1 } }, MOBILE_FAST],
  },
  // The three games (spec 11.13, G17): a game waits for the visitor and moves by transform only, so desktop
  // carries the Hub's gates, and phones the floor. Cricket, Tennis and Badminton are gated without WebGL, and their 3D only reported (above).
  {
    path: "/arena/cricket",
    variants: [
      { ...DESKTOP, chromeFlags: NO_3D, gate: { ...FRESH, fcp: 1500, cls: 0.1 } },
      { ...MOBILE_FAST, chromeFlags: NO_3D },
      { ...DESKTOP, name: "desktop, 3D (software WebGL)", chromeFlags: SWIFTSHADER },
      { ...MOBILE, name: "mobile, 3D (software WebGL)", chromeFlags: SWIFTSHADER },
    ],
  },
  {
    path: "/arena/tennis",
    variants: [
      { ...DESKTOP, chromeFlags: NO_3D, gate: { ...FRESH, fcp: 1500, cls: 0.1 } },
      { ...MOBILE_FAST, chromeFlags: NO_3D },
      { ...DESKTOP, name: "desktop, 3D (software WebGL)", chromeFlags: SWIFTSHADER },
      { ...MOBILE, name: "mobile, 3D (software WebGL)", chromeFlags: SWIFTSHADER },
    ],
  },
  {
    path: "/arena/badminton",
    variants: [
      { ...DESKTOP, chromeFlags: NO_3D, gate: { ...FRESH, fcp: 1500, cls: 0.1 } },
      { ...MOBILE_FAST, chromeFlags: NO_3D },
      { ...DESKTOP, name: "desktop, 3D (software WebGL)", chromeFlags: SWIFTSHADER },
      { ...MOBILE, name: "mobile, 3D (software WebGL)", chromeFlags: SWIFTSHADER },
    ],
  },
  // Full Time (spec 11.14, F13): the matchday's last page, entered by CSS keyframes only, so desktop carries the Hub's gates.
  {
    path: "/arena/full-time",
    variants: [{ ...DESKTOP, gate: { ...FRESH, fcp: 1500, cls: 0.1 } }, MOBILE_FAST],
  },
];

const METRICS = [
  { id: "fcp", audit: "first-contentful-paint", label: "FCP" },
  { id: "lcp", audit: "largest-contentful-paint", label: "LCP" },
  { id: "cls", audit: "cumulative-layout-shift", label: "CLS" },
  { id: "tbt", audit: "total-blocking-time", label: "TBT" },
];

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

async function answers(url) {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
};
const COMPRESSIBLE = /^(text\/|application\/(javascript|json|xml)|image\/svg\+xml)/;

/** The file a URL names: the file itself, a folder's index.html, or the SPA fallback page. Null when the path is not valid text (a bad %-escape). */
function fileFor(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const clean = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  for (const candidate of [clean, join(clean, "index.html"), `${clean}.html`]) {
    const file = join(BUILD, candidate);
    if (file.startsWith(BUILD) && existsSync(file) && statSync(file).isFile()) return file;
  }
  return join(BUILD, "__spa-fallback.html");
}

/**
 * The static server, standing in for the production host (Vercel serves brotli): text responses are
 * brotli-compressed, each file once and kept in memory; everything else is sent as is. Nothing is written into
 * build/client. Without this the phone numbers are dominated by uncompressed transfer sizes.
 */
function createBrotliServer() {
  const cache = new Map();
  return createServer((req, res) => {
    const file = fileFor(new URL(req.url ?? "/", ORIGIN).pathname);
    if (!file) {
      res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      res.end("Bad request");
      return;
    }
    const type = TYPES[extname(file)] ?? "application/octet-stream";
    const headers = {
      "content-type": type,
      "cache-control": file.includes("/assets/")
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    };
    const packed =
      COMPRESSIBLE.test(type) && String(req.headers["accept-encoding"] ?? "").includes("br");
    if (!packed) {
      res.writeHead(200, { ...headers, "content-length": statSync(file).size });
      res.end(readFileSync(file));
      return;
    }
    let body = cache.get(file);
    if (!body) {
      body = brotliCompressSync(readFileSync(file), { params: { [zlib.BROTLI_PARAM_QUALITY]: 5 } });
      cache.set(file, body);
    }
    res.writeHead(200, {
      ...headers,
      "content-encoding": "br",
      "content-length": body.length,
      vary: "Accept-Encoding",
    });
    res.end(body);
  });
}

async function waitForServer(url) {
  for (let i = 0; i < 100; i++) {
    if (await answers(url)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Static server did not answer at ${url}.`);
}

function scoresOf(lhr) {
  return Object.fromEntries(CATEGORIES.map((id) => [id, lhr.categories[id].score ?? 0]));
}

function metricsOf(lhr) {
  return Object.fromEntries(METRICS.map((m) => [m.id, lhr.audits[m.audit]?.numericValue ?? NaN]));
}

/** Names of the audits that cost points in a category, for the failure message. */
function weakAudits(lhr, category) {
  return lhr.categories[category].auditRefs
    .filter((ref) => ref.weight > 0 && (lhr.audits[ref.id].score ?? 1) < 1)
    .map((ref) => `${ref.id} (${lhr.audits[ref.id].score ?? "n/a"})`);
}

const pct = (score) => String(Math.round(score * 100)).padStart(3);
const ms = (value) => `${Math.round(value)} ms`.padStart(8);
const cls = (value) => value.toFixed(3).padStart(8);

function formatRow(label, scores, metrics) {
  return (
    `${label.padEnd(36)}` +
    `${pct(scores.performance)} ${pct(scores.accessibility)} ${pct(scores["best-practices"])} ${pct(scores.seo)}  ` +
    `${ms(metrics.fcp)} ${ms(metrics.lcp)} ${cls(metrics.cls)} ${ms(metrics.tbt)}`
  );
}

const TABLE_HEAD = `${"".padEnd(36)}perf a11y  bp seo       FCP      LCP      CLS      TBT`;

/** Runs one variant RUNS times in its own Chrome and returns the rows and the gated values. */
async function measure(url, variant) {
  const chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ["--headless=new", "--no-sandbox", ...(variant.chromeFlags ?? [])],
  });
  try {
    const runs = [];
    let lastLhr;
    for (let run = 1; run <= RUNS; run++) {
      const result = await lighthouse(
        url,
        { port: chrome.port, output: "json", logLevel: "error", onlyCategories: CATEGORIES },
        variant.config,
      );
      if (!result) throw new Error(`Lighthouse returned nothing for ${variant.name}.`);
      lastLhr = result.lhr;
      runs.push({ scores: scoresOf(result.lhr), metrics: metricsOf(result.lhr) });
    }
    return { runs, lastLhr };
  } finally {
    await chrome.kill();
  }
}

async function main() {
  if (!existsSync(join(BUILD, "index.html"))) {
    console.error("build/client is missing. Run `pnpm build` first.");
    return 1;
  }
  if (await answers(ORIGIN)) {
    console.error(`Port ${PORT} is already in use. Stop whatever is serving it, then run again.`);
    return 1;
  }

  let server;
  try {
    server = createBrotliServer();
    await new Promise((ok, fail) => {
      server.once("error", fail);
      server.listen(PORT, "127.0.0.1", ok);
    });
    await waitForServer(`${ORIGIN}/scout`);

    // Lighthouse performance is noisy (the very first run after a build has scored Speed Index 0.02 once),
    // so performance and the timings are gated on the median of RUNS runs (CLS on the worst run).
    // Accessibility, best practices and SEO are deterministic: they are gated on the worst of the same runs,
    // with no retry. Every run is printed.
    const failures = [];
    // LIGHTHOUSE_ONLY=/arena/tennis runs a single page (a quick check; the full run is still the phase-exit gate).
    for (const page of PAGES.filter(
      (p) => !process.env.LIGHTHOUSE_ONLY || p.path === process.env.LIGHTHOUSE_ONLY,
    )) {
      console.log(`\n${page.path}\n${TABLE_HEAD}`);
      for (const variant of page.variants) {
        const { runs, lastLhr } = await measure(`${ORIGIN}${page.path}`, variant);
        runs.forEach((run, i) =>
          console.log(formatRow(`  ${variant.name} run ${i + 1}`, run.scores, run.metrics)),
        );
        const gated = {
          scores: Object.fromEntries(
            CATEGORIES.map((id) => {
              const values = runs.map((r) => r.scores[id]);
              return [id, id === "performance" ? median(values) : Math.min(...values)];
            }),
          ),
          metrics: Object.fromEntries(
            METRICS.map(({ id }) => {
              const values = runs.map((r) => r.metrics[id]);
              return [id, id === "cls" ? Math.max(...values) : median(values)];
            }),
          ),
        };
        console.log(formatRow(`> ${variant.name} (gate)`, gated.scores, gated.metrics));

        const where = `${page.path} ${variant.name}`;
        for (const [id, limit] of Object.entries(variant.gate ?? {})) {
          if (CATEGORIES.includes(id)) {
            if (gated.scores[id] + 1e-9 < limit) {
              failures.push(
                `${where} ${id}: ${Math.round(gated.scores[id] * 100)} < ${Math.round(limit * 100)}. ` +
                  `Audits below full marks (last run): ${weakAudits(lastLhr, id).join(", ") || "none listed"}`,
              );
            }
          } else if (gated.metrics[id] > limit) {
            const unit = id === "cls" ? "" : " ms";
            failures.push(
              `${where} ${id.toUpperCase()}: ${gated.metrics[id].toFixed(id === "cls" ? 3 : 0)}${unit} > ${limit}${unit}`,
            );
          }
        }
      }
    }
    console.log(
      "\ngate rows: performance = median, accessibility / best practices / SEO = worst run,",
    );
    console.log(
      "FCP / LCP / TBT = median, CLS = worst run. Variants without a gate for a column only report it.",
    );
    if (failures.length > 0) {
      console.error(`\nLighthouse budget missed:\n- ${failures.join("\n- ")}`);
      return 1;
    }
    console.log("\nLighthouse budget met.");
    return 0;
  } finally {
    if (server) server.close();
  }
}

process.exitCode = await main().catch((err) => {
  console.error(err);
  return 1;
});
