/** WebGL2 is what three.js and React Three Fiber need. Checked once, on a throwaway canvas, then released. */
export function canUse3d(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}
