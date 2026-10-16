let known: boolean | undefined;

/**
 * WebGL2 is what three.js and React Three Fiber need. Checked once per visit to the site, on a throwaway canvas, then
 * released: making a context takes a while, so coming back to a game does not pay for it again.
 */
export function canUse3d(): boolean {
  if (typeof document === "undefined") return false;
  if (known !== undefined) return known;
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    known = !!gl;
  } catch {
    known = false;
  }
  return known;
}
