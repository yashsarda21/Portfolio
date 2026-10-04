#!/usr/bin/env node
// Lighthouse budget for the recruiter page (/scout). Not part of `pnpm verify` (slow): run it at a phase exit.
// Usage: pnpm build && pnpm lighthouse
//
// Serves build/client on port 4174 (the user's `pnpm preview` on 4173 is left alone), drives Playwright's
// Chromium through chrome-launcher, and fails unless the budget below is met.
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
const PAGE = `${ORIGIN}/scout`;

// Minimum category scores (0–1). Mobile is measured and printed; only its accessibility is gated.
const BUDGET = {
  desktop: { performance: 0.9, accessibility: 1, "best-practices": 0.9, seo: 0.9 },
  mobile: { accessibility: 1 },
};
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];
const RUNS = 3;

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

/** Names of the audits that cost points in a category, for the failure message. */
function weakAudits(lhr, category) {
  return lhr.categories[category].auditRefs
    .filter((ref) => ref.weight > 0 && (lhr.audits[ref.id].score ?? 1) < 1)
    .map((ref) => `${ref.id} (${lhr.audits[ref.id].score ?? "n/a"})`);
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
  let chrome;
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
    await waitForServer(PAGE, server);

    chrome = await launch({
      chromePath: chromium.executablePath(),
      chromeFlags: ["--headless=new", "--no-sandbox"],
    });

    // Lighthouse performance is noisy (the very first run after a build has scored Speed Index 0.02 once),
    // so it is gated on the median of RUNS runs. Accessibility, best practices and SEO are deterministic:
    // they are gated on the worst of the same runs, with no retry. Every run is printed.
    const failures = [];
    for (const [name, config] of [
      ["desktop", desktopConfig],
      ["mobile", undefined],
    ]) {
      const runs = [];
      let lastLhr;
      for (let run = 1; run <= RUNS; run++) {
        const result = await lighthouse(
          PAGE,
          { port: chrome.port, output: "json", logLevel: "error", onlyCategories: CATEGORIES },
          config,
        );
        if (!result) throw new Error(`Lighthouse returned nothing for ${name}.`);
        lastLhr = result.lhr;
        const scores = scoresOf(result.lhr);
        runs.push(scores);
        console.log(
          `${name.padEnd(8)}run ${run}  ` +
            CATEGORIES.map((id) => `${id} ${Math.round(scores[id] * 100)}`).join("  "),
        );
      }
      const gated = Object.fromEntries(
        CATEGORIES.map((id) => {
          const values = runs.map((r) => r[id]);
          return [id, id === "performance" ? median(values) : Math.min(...values)];
        }),
      );
      console.log(
        `${name.padEnd(8)}gate   ` +
          CATEGORIES.map((id) => `${id} ${Math.round(gated[id] * 100)}`).join("  ") +
          "  (performance = median, others = worst run)",
      );
      for (const [id, min] of Object.entries(BUDGET[name])) {
        if (gated[id] + 1e-9 < min) {
          failures.push(
            `${name} ${id}: ${Math.round(gated[id] * 100)} < ${Math.round(min * 100)}. ` +
              `Audits below full marks (last run): ${weakAudits(lastLhr, id).join(", ") || "none listed"}`,
          );
        }
      }
    }
    if (failures.length > 0) {
      console.error(`\nLighthouse budget missed:\n- ${failures.join("\n- ")}`);
      return 1;
    }
    console.log("\nLighthouse budget met.");
    return 0;
  } finally {
    if (chrome) await chrome.kill();
    if (server && server.exitCode === null) server.kill();
  }
}

process.exitCode = await main().catch((err) => {
  console.error(err);
  return 1;
});
