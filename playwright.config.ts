import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
// `pnpm verify` is the only merge gate: never reuse a stale server, never allow focused tests.
const strict = !!process.env.CI || process.env.VERIFY === "1";

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results/playwright",
  fullyParallel: true,
  forbidOnly: strict,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm preview",
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !strict,
    timeout: 180_000,
  },
});
