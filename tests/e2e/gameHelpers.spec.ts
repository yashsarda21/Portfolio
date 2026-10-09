import { expect, test } from "@playwright/test";
import { cssVar, freezeClock, openFrozen, pauseClock, stepUntil } from "./support/game";

// The shared game helpers (support/game.ts) before any game route exists: a stub page stands in for the game.

test("freezeClock + pauseClock stop time; stepUntil and cssVar then drive it", async ({ page }) => {
  await freezeClock(page);
  await page.goto("about:blank");
  // A stand-in meter: --meter sweeps 0 → 1 over 1000 ms of performance.now(), written once per frame.
  await page.setContent(`<div data-game></div><script>
    const root = document.querySelector("[data-game]");
    const t0 = performance.now();
    const tick = () => {
      root.style.setProperty("--meter", String(Math.min(1, (performance.now() - t0) / 1000)));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  </script>`);
  await pauseClock(page);

  const before = await cssVar(page, "--meter");
  await page.waitForTimeout(300); // real time passes; the fake clock does not move
  expect(await cssVar(page, "--meter")).toBe(before);

  const reached = await stepUntil(
    page,
    () => cssVar(page, "--meter"),
    (v) => v >= 0.9,
  );
  expect(reached).toBeGreaterThanOrEqual(0.9);
  await expect(
    stepUntil(
      page,
      () => cssVar(page, "--meter"),
      () => false,
    ),
  ).rejects.toThrow("never met");
});

test("openFrozen loads a real page, waits for hydration and stops time there", async ({ page }) => {
  await openFrozen(page, "/");
  const now = () => page.evaluate(() => Date.now());
  const start = await now();
  await page.waitForTimeout(300);
  expect(await now()).toBe(start);
  await page.clock.runFor(500);
  expect(await now()).toBe(start + 500);
});
