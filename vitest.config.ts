import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { buildDefine } from "./vite.define.ts";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  define: buildDefine,
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tools/**/*.test.ts", "tests/support/**/*.test.ts"],
    css: false,
    restoreMocks: true,
    // `pnpm verify` is the merge gate: a stray .only must fail it.
    allowOnly: !(process.env.CI || process.env.VERIFY === "1"),
  },
});
