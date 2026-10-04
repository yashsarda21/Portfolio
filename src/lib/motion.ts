export { gsap } from "gsap";

/** True when the visitor asked for reduced motion (always false during prerender). */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}
