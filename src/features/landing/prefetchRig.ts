const asked = new Set<string>();
// The Images are kept so the browser does not drop the requests before they finish.
const held: HTMLImageElement[] = [];

interface NetworkInformation {
  saveData?: boolean;
}

/**
 * Warm the intro's head-turn frames (L7): once the page has loaded and the browser is idle, request each
 * strip with an Image() (nothing is added to the page). Desktop and tablet only (they play the full intro),
 * never under reduced motion or data saver. Each URL is asked for once.
 */
export function prefetchRig(urls: readonly string[]): void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
  if (!window.matchMedia("(min-width: 768px)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (connection?.saveData) return;

  const todo = urls.filter((u) => !asked.has(u));
  if (todo.length === 0) return;
  todo.forEach((u) => asked.add(u));

  const run = () => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1000));
    idle(() => {
      for (const src of todo) {
        const img = new Image();
        img.src = src;
        held.push(img);
      }
    });
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
}
