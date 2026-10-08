import type { Page } from "@playwright/test";

/**
 * Resolves once the page's finite animations are over (axe and the press tests judge a part at rest; a looping
 * animation never ends and is left alone). `root` limits it to the parts inside one element (a selector);
 * `maxMs` leaves out any animation whose delay plus duration is that long or longer (a slow show that has its own wait).
 */
export async function waitForFiniteAnimations(
  page: Page,
  { root, maxMs = Infinity }: { root?: string; maxMs?: number } = {},
) {
  await page.evaluate(
    ({ root, maxMs }) => {
      const scope = root ? document.querySelector(root) : document;
      return Promise.all(
        (scope?.getAnimations({ subtree: true }) ?? [])
          .filter((a) => {
            const timing = a.effect?.getTiming();
            return (
              !!timing &&
              timing.iterations !== Infinity &&
              Number(timing.delay) + Number(timing.duration) < maxMs
            );
          })
          // A cancelled animation rejects its `finished`: it is over all the same.
          .map((a) => a.finished.catch(() => undefined)),
      );
    },
    { root, maxMs },
  );
}
