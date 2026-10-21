import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
// The 2D projects switch WebGL off, so every existing spec keeps testing the 2D game; the -3d specs get software GL.
const NO_3D = { args: ["--disable-3d-apis"] };
const SOFTWARE_GL = { args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"] };
const DESKTOP = {
  ...devices["Desktop Chrome"],
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
};
const MOBILE = {
  ...devices["Desktop Chrome"],
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  hasTouch: true,
};
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
      // The 2D game on a desktop: WebGL is off, so the 3D scene never loads.
      name: "desktop",
      testIgnore: [/webkit-smoke/, /-3d\.spec/],
      use: { ...DESKTOP, launchOptions: NO_3D },
    },
    {
      // The 2D game on a phone: WebGL is off, so the 3D scene never loads.
      name: "mobile",
      testIgnore: [/webkit-smoke/, /-3d\.spec/],
      use: { ...MOBILE, launchOptions: NO_3D },
    },
    {
      // The 3D game on a desktop: software WebGL2, so the -3d specs run on any machine.
      name: "desktop-3d",
      testMatch: /-3d\.spec/,
      // Software WebGL is heavy: one worker at a time keeps the 30 s open and the 10 s show cap from being missed.
      workers: 1,
      use: { ...DESKTOP, launchOptions: SOFTWARE_GL },
    },
    {
      // The 3D game on a phone: software WebGL2, so the -3d specs run on any machine.
      name: "mobile-3d",
      testMatch: /-3d\.spec/,
      // Software WebGL is heavy: one worker at a time keeps the 30 s open and the 10 s show cap from being missed.
      workers: 1,
      use: { ...MOBILE, launchOptions: SOFTWARE_GL },
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
