import { describe, expect, it } from "vitest";
import { type GameSpotlight, SPOTLIGHT_EXIT_MS, SPOTLIGHT_MS, holdFor } from "./spotlight";

const unlock: GameSpotlight = {
  kind: "unlock",
  eyebrow: "HIGHLIGHT 02 · SF",
  title: "KUDO BOARD",
  line: "Shipped to the whole team",
  to: "left",
};

describe("holdFor", () => {
  it("holds an unlock for the full spotlight", () => {
    expect(holdFor(unlock, 1500)).toBe(SPOTLIGHT_MS);
  });

  it("keeps the game's own call time for the visitor's words, and for no spotlight", () => {
    expect(holdFor({ kind: "yours", text: "WELL PLAYED." }, 1500)).toBe(1500);
    expect(holdFor(null, 900)).toBe(900);
  });

  it("leaves room for the exit inside the hold", () => {
    expect(SPOTLIGHT_MS).toBe(4500);
    // motion.css starts the exit 4050 ms in (--spot-delay); keep the two in step.
    expect(SPOTLIGHT_MS - SPOTLIGHT_EXIT_MS).toBe(4050);
  });
});
