import type { gsap as Gsap } from "gsap";

/** A memoised loader that forgets a failed attempt, so a later call can retry the download. */
export function createGsapLoader(
  load: () => Promise<{ gsap: typeof Gsap }> = () => import("gsap"),
): () => Promise<typeof Gsap> {
  let pending: Promise<typeof Gsap> | null = null;
  return () => {
    pending ??= load()
      .then((m) => m.gsap)
      .catch((e: unknown) => {
        pending = null;
        throw e;
      });
    return pending;
  };
}

/** GSAP is loaded on demand so it never sits in the first-load bundle (spec §9.1 budget). */
export const loadGsap = createGsapLoader();

/** Warm the GSAP chunk once the page is idle (landing → intro, any wipe). */
export function prefetchGsap(): void {
  if (typeof window === "undefined") return;
  const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1000));
  idle(() => void loadGsap());
}

/** CSS cubic-bezier as a GSAP ease function (x→y by Newton iterations). */
export function bezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const x = (t: number) => ((ax * t + bx) * t + cx) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const y = (t: number) => ((ay * t + by) * t + cy) * t;
  return (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let t = p;
    for (let i = 0; i < 8; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (x(t) - p) / d;
    }
    return y(Math.min(1, Math.max(0, t)));
  };
}

/** The motion tokens (theme.css --ease-*) as GSAP eases. motion.test.ts checks these against the CSS. */
export const EASE = {
  follow: bezier(0.22, 1, 0.36, 1),
  snap: bezier(0.2, 0.9, 0.1, 1),
  swing: bezier(0.65, 0, 0.35, 1),
  entrance: bezier(0.12, 0.9, 0.25, 1),
  standard: bezier(0.4, 0, 0.2, 1),
  absorb: bezier(0.7, 0, 0.84, 0),
} as const;

/** True when the visitor asked for reduced motion (always false during prerender). */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}
