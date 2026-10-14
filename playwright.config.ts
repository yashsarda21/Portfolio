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
      testIgnore: /webkit-smoke/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: "mobile",
      testIgnore: /webkit-smoke/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        hasTouch: true,
      },
    },
    {
      // The real Safari engine as a phone (P10, m-7): the iPhone preset is `isMobile`, so the viewport meta, touch and
      // the mobile layout rules apply as on a device, at the 390×844 the other phone checks use. It runs the one smoke
      // spec: `playwright test --project=webkit`.
      name: "webkit",
      testMatch: /webkit-smoke/,
      use: {
        ...devices["iPhone 13"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      },
    },
  ],
  webServer: {
    // VITE_SITE_URL: a reserved test name, so the canonical / sitemap / robots specs have an address to check.
    command: "VITE_SITE_URL=https://arena.example pnpm build && pnpm preview",
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !strict,
    timeout: 180_000,
  },
});
