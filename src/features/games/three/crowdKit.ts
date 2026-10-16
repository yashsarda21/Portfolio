import { tokenColor } from "./tokens";

/** A small random sequence that is the same on every visit (the crowd's seats and shirts). */
export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The crowd's shirt colours: mostly whites and greys under the lights, with some colour. Made when the scene is built. */
export function crowdColors() {
  return [
    "--ref-floodlight",
    "--ref-floodlight",
    "--ref-text-2",
    "--ref-text-2",
    "--ref-scout-grey",
    "--ref-scout-grey",
    "--ref-dim",
    "--ref-dim",
    "--ref-line-hover",
    "--ref-stand-hi",
    "--ref-court-mid",
    "--ref-hall-mid",
    "--ref-volt",
    "--ref-live-red",
  ].map(tokenColor);
}
