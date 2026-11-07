#!/usr/bin/env node
// Runs after `react-router build`.
//  1. A static host serves a real 404 status from /404.html for every unknown address. That file is the client-only
//     page (__spa-fallback.html), so the router renders the catch-all once at the address tried; the prerendered
//     OUT OF BOUNDS content (build/client/404/index.html) is added in a <noscript> for visitors without JavaScript
//     (see tools/notfound.mjs).
//  2. Every prerendered page gets its own Content-Security-Policy <meta>, listing the exact hash of each of its
//     inline scripts (see tools/csp.mjs). The host-only headers (frame-ancestors, upgrade-insecure-requests and the rest) are in public/_headers (Cloudflare).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildEnv } from "./buildEnv.mjs";
import { formOriginOf, withCsp } from "./csp.mjs";
import { notFoundFile } from "./notfound.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLIENT = join(ROOT, "build/client");

writeFileSync(
  join(CLIENT, "404.html"),
  notFoundFile(
    readFileSync(join(CLIENT, "__spa-fallback.html"), "utf8"),
    readFileSync(join(CLIENT, "404/index.html"), "utf8"),
  ),
);
console.log("postbuild: build/client/404.html written");

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith(".html") ? [path] : [];
  });
}

const formOrigin = formOriginOf(buildEnv(ROOT).VITE_FORM_ENDPOINT);
const pages = htmlFiles(CLIENT);
const distinct = new Set();
for (const page of pages) {
  const { html, scriptHashes } = withCsp(readFileSync(page, "utf8"), formOrigin);
  writeFileSync(page, html);
  scriptHashes.forEach((hash) => distinct.add(hash));
}
console.log(
  `postbuild: CSP added to ${pages.length} pages, ${distinct.size} distinct inline-script hashes` +
    (formOrigin ? `, form origin ${formOrigin}` : ", no form origin"),
);
