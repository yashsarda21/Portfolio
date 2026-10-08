/**
 * The artboards' own random numbers (Intro.dc.html: a linear congruential generator). The same seed gives the
 * same sequence, so a layout drawn "at random" (the intro's letter order and 90 pixels) is the same every time
 * and matches the artboard. Each call returns a number in [0, 1).
 */
export function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}
