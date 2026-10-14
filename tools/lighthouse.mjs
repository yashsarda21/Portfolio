#!/usr/bin/env node
// Lighthouse budget for the pages that carry a promise: the recruiter page (/scout), the Landing (/), the
// Player Intro (/intro), the Arena Hub (/arena), the three games (/arena/cricket, /tennis, /badminton) and Full Time (/arena/full-time). Not part of `pnpm verify` (slow): run it at a phase exit.
// Usage: pnpm build && pnpm lighthouse
// This script does not build: it reads whatever build/client holds. The SEO audit wants a canonical link, so build
// with the test address (as `pnpm verify` and the e2e web server do): VITE_SITE_URL=https://arena.example pnpm build
//
// Serves build/client on port 4174 (the user's `pnpm preview` on 4173 is left alone), drives Playwright's
// Chromium through chrome-launcher, and fails unless the budget below is met. Every page prints one table:
// performance / accessibility / best practices / SEO, plus FCP, LCP, CLS and TBT from the audits.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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

/**
 * The pages. Landing (spec 11.11, ruling L13): the full-motion run is reported for performance (the 3 s name
 * reveal is the largest paint by design) and gated on everything else; the reduced-motion run, which
 * measures the code's real cost, is where performance >= .9 is gated. The Intro gates everything but
 * performance. /scout keeps its original gate: desktop in full, mobile accessibility only.
 */
const PAGES = [
  {
    path: "/scout",
    variants: [
      { ...DESKTOP, gate: FRESH },
      { ...MOBILE, gate: { accessibility: 1 } },
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
    ],
  },
  {
    path: "/intro",
    variants: [{ ...DESKTOP, gate: { accessibility: 1, "best-practices": 0.9, seo: 0.9 } }, MOBILE],
  },
  {
    // The Hub (spec 11.12, H15): a calm page with no long reveal, so desktop is gated in full.
    path: "/arena",
    variants: [{ ...DESKTOP, gate: { ...FRESH, fcp: 1500, cls: 0.1 } }, MOBILE],
  },
  // The three games (spec 11.13, G17): a game waits for the visitor and moves by transform only, so desktop
  // carries the Hub's gates. Mobile is reported.
  ...["/arena/cricket", "/arena/tennis", "/arena/badminton"].map((path) => ({
    path,
    variants: [{ ...DESKTOP, gate: { ...FRESH, fcp: 1500, cls: 0.1 } }, MOBILE],
  })),
  // Full Time (spec 11.14, F13): the matchday's last page, entered by CSS keyframes only, so desktop carries the Hub's gates.
  {
    path: "/arena/full-time",
    variants: [{ ...DESKTOP, gate: { ...FRESH, fcp: 1500, cls: 0.1 } }, MOBILE],
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

async function waitForServer(url, server) {
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null)
      throw new Error(`Static server exited early (code ${server.exitCode}).`);
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
    `${label.padEnd(30)}` +
    `${pct(scores.performance)} ${pct(scores.accessibility)} ${pct(scores["best-practices"])} ${pct(scores.seo)}  ` +
    `${ms(metrics.fcp)} ${ms(metrics.lcp)} ${cls(metrics.cls)} ${ms(metrics.tbt)}`
  );
}

const TABLE_HEAD = `${"".padEnd(30)}perf a11y  bp seo       FCP      LCP      CLS      TBT`;

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
    server = spawn(
      join(ROOT, "node_modules/.bin/sirv"),
      [
        "build/client",
        "--single",
        "__spa-fallback.html",
        "--port",
        String(PORT),
        "--host",
        "127.0.0.1",
      ],
      { cwd: ROOT, stdio: "ignore" },
    );
    await waitForServer(`${ORIGIN}/scout`, server);

    // Lighthouse performance is noisy (the very first run after a build has scored Speed Index 0.02 once),
    // so performance and the timings are gated on the median of RUNS runs (CLS on the worst run).
    // Accessibility, best practices and SEO are deterministic: they are gated on the worst of the same runs,
    // with no retry. Every run is printed.
    const failures = [];
    for (const page of PAGES) {
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
    if (server && server.exitCode === null) server.kill();
  }
}

process.exitCode = await main().catch((err) => {
  console.error(err);
  return 1;
});
