import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { buildDefine } from "../vite.define.ts";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: { tsconfigPaths: true },
  define: buildDefine,
});
