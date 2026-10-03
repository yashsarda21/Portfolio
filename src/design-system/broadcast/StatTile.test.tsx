import { act, render, screen } from "@testing-library/react";
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

  it("shows a changed target straight away", () => {
    const { rerender } = render(<StatTile label="PROBLEMS" value="750+" countUp />);
    rerender(<StatTile label="PROBLEMS" value="800+" countUp />);
    expect(screen.getByText("800+", { selector: "[aria-hidden='true']" })).toBeInTheDocument();
  });
});

describe("StatTile count-up from below the fold", () => {
  type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;
  let callbacks: Callback[];
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    callbacks = [];
    frames = [];
    class FakeObserver {
      constructor(cb: Callback) {
        callbacks.push(cb);
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    // Below the fold at mount, so the hook arms its observers.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      top: window.innerHeight + 400,
      bottom: window.innerHeight + 500,
    } as DOMRect);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const shown = () => screen.getByText(/\d/, { selector: "[aria-hidden='true']" });

  it("keeps the real number when the tile is already visible by the time it arms", () => {
    render(<StatTile label="PROBLEMS" value="750+" countUp />);
    act(() =>
      callbacks[0]?.([{ isIntersecting: true, boundingClientRect: { top: 100 } as DOMRect }]),
    );
    expect(shown()).toHaveTextContent("750+");
    expect(callbacks).toHaveLength(1); // never armed the play observer
  });

  it("zeroes while below the fold, then counts up to the final value", () => {
    render(<StatTile label="PROBLEMS" value="750+" countUp />);
    act(() =>
      callbacks[0]?.([
        { isIntersecting: true, boundingClientRect: { top: window.innerHeight + 100 } as DOMRect },
      ]),
    );
    expect(shown()).toHaveTextContent("0+");
    act(() => callbacks[1]?.([{ isIntersecting: true }]));
    act(() => frames.shift()?.(performance.now() + 5000));
    expect(shown()).toHaveTextContent("750+");
  });
});
