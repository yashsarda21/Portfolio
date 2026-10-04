import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import raw from "./src/content/content.json";
import { parseContent } from "./src/content/schema";

/** Validates content.json at dev start and build, so the client bundle never needs Zod (spec §6). */
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
