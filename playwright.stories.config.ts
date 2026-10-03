import { defineConfig, devices } from "@playwright/test";

const PORT = 6007;
const strict = !!process.env.CI || process.env.VERIFY === "1";

// Runs against the static Storybook build (`pnpm build-storybook` first).
export default defineConfig({
  testDir: "tests/stories",
  outputDir: "test-results/stories",
  fullyParallel: true,
  forbidOnly: strict,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
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
    command: `sirv storybook-static --port ${PORT} --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !strict,
    timeout: 60_000,
  },
});
