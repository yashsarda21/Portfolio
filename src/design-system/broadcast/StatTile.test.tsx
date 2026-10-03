import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StatTile, parseStat } from "./StatTile";

describe("parseStat", () => {
  it.each([
    ["750+", { prefix: "", number: 750, decimals: 0, suffix: "+" }],
    ["8.94", { prefix: "", number: 8.94, decimals: 2, suffix: "" }],
    ["10K+", { prefix: "", number: 10, decimals: 0, suffix: "K+" }],
    ["99.5", { prefix: "", number: 99.5, decimals: 1, suffix: "" }],
  ])("%s", (input, expected) => {
    expect(parseStat(input)).toEqual(expected);
  });

  it("returns null for non-numeric values", () => {
    expect(parseStat("DEUTSCHE")).toBeNull();
  });
});

describe("StatTile count-up", () => {
  let observe: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    observe = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn(() => ({ observe, disconnect: vi.fn(), unobserve: vi.fn() })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("always exposes the final value to screen readers", () => {
    render(<StatTile label="PROBLEMS" value="750+" countUp />);
    expect(screen.getByText("750+", { selector: ".sr-only" })).toBeInTheDocument();
  });

  it("shows the final value when the tile is already on screen (no flicker)", () => {
    // jsdom reports a 0×0 rect at the top: treated as "in viewport" at mount.
    render(<StatTile label="PROBLEMS" value="750+" countUp />);
    expect(screen.getByText("750+", { selector: "[aria-hidden='true']" })).toBeInTheDocument();
    expect(observe).not.toHaveBeenCalled();
  });

  it("does not animate with reduced motion", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: q.includes("reduce"),
      media: q,
      addEventListener() {},
      removeEventListener() {},
    }));
    render(<StatTile label="CGPA" value="8.94" countUp />);
    expect(screen.getByText("8.94", { selector: "[aria-hidden='true']" })).toBeInTheDocument();
    expect(observe).not.toHaveBeenCalled();
  });
});
