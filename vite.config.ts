import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import raw from "./src/content/content.json" with { type: "json" };
import { parseContent } from "./src/content/schema.ts";

/**
 * Validates content.json at dev start and build, so the client bundle never needs Zod (spec §6).
 * content.json is imported by this config, so Vite restarts the dev server on every edit and the check
 * re-runs; an invalid edit logs the ContentError path ("server restart failed") and the next fix recovers.
 */
function contentCheck(): Plugin {
  return {
    name: "arena-content-check",
    buildStart() {
      parseContent(raw);
    },
  };
}

export default defineConfig({
  plugins: [contentCheck(), tailwindcss(), reactRouter()],
  resolve: { tsconfigPaths: true },
});
