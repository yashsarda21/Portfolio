/** True unless the visitor asked for reduced motion (false during prerender: nothing moves before hydration). */
export function motionAllowed(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True when the main pointer is precise (a mouse or trackpad), so hover motion makes sense. */
export function finePointer(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(pointer: fine)").matches;
}
