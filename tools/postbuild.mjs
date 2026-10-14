#!/usr/bin/env node
// Runs after `react-router build`. A static host serves a real 404 status from /404.html, so the prerendered
// OUT OF BOUNDS page (build/client/404/index.html) is copied there.
import { copyFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CLIENT = join(resolve(dirname(fileURLToPath(import.meta.url)), ".."), "build/client");

copyFileSync(join(CLIENT, "404/index.html"), join(CLIENT, "404.html"));
console.log("postbuild: build/client/404.html written");
