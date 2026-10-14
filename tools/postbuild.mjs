#!/usr/bin/env node
// Runs after `react-router build`.
//  1. A static host serves a real 404 status from /404.html, so the prerendered OUT OF BOUNDS page
//     (build/client/404/index.html) is copied there.
//  2. Every prerendered page gets its own Content-Security-Policy <meta>, listing the exact hash of each of its
//     inline scripts (see tools/csp.mjs). The host-only headers (frame-ancestors, upgrade-insecure-requests and the rest) are in vercel.json.
import { copyFileSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { formOriginOf, withCsp } from "./csp.mjs";

const CLIENT = join(resolve(dirname(fileURLToPath(import.meta.url)), ".."), "build/client");

copyFileSync(join(CLIENT, "404/index.html"), join(CLIENT, "404.html"));
console.log("postbuild: build/client/404.html written");

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith(".html") ? [path] : [];
  });
}

const formOrigin = formOriginOf(process.env.VITE_FORM_ENDPOINT);
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
