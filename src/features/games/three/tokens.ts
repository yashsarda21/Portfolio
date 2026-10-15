import { Color } from "three";

/**
 * A design token's colour (a CSS custom property on the root, e.g. `--ref-night`) as a three.js colour, so every
 * colour in a 3D scene comes from the tokens. Read when called: call it when the scene is built, not at import.
 */
export function tokenColor(name: string): Color {
  return new Color(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
}
