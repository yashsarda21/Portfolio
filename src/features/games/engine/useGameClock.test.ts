import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pingPong } from "./clock";
import { useGameClock } from "./useGameClock";

/** A manual frame pump: `rAF` queues the callback, `frames(ms)` moves the fake clock 10 ms and runs one frame, repeatedly. */
let queue = new Map<number, FrameRequestCallback>();
let nextId = 1;
const frames = (ms: number, step = 10) => {
  for (let t = 0; t < ms; t += step) {
    vi.advanceTimersByTime(step);
    const due = [...queue.entries()];
    queue = new Map();
    for (const [, cb] of due) cb(performance.now());
  }
};
const setHidden = (hidden: boolean) => {
  Object.defineProperty(document, "visibilityState", {
    value: hidden ? "hidden" : "visible",
    configurable: true,
  });
  Object.defineProperty(document, "hidden", { value: hidden, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
};

beforeEach(() => {
  vi.useFakeTimers();
  queue = new Map();
  nextId = 1;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    queue.set(nextId, cb);
    return nextId++;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => queue.delete(id));
});
afterEach(() => {
  setHidden(false);
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function setup(running = true) {
  const target = document.createElement("div");
  const hook = renderHook(
    ({ on }) =>
      useGameClock(
        { current: target },
        { cssVar: "--meter", value: (t) => pingPong(t, 1100), running: on },
      ),
    { initialProps: { on: running } },
  );
  return { target, ...hook };
}
const meter = (el: HTMLElement) => el.style.getPropertyValue("--meter");

describe("useGameClock", () => {
  it("writes value(elapsed) to the target's variable, and elapsed() reads the same clock", () => {
    const { target, result } = setup();
    frames(550);
    expect(meter(target)).toBe("0.5");
    expect(result.current.elapsed()).toBe(550);
  });

  it("stops writing when running is false, and keeps its last value and its time", () => {
    const { target, result, rerender } = setup();
    frames(300);
    const last = meter(target);
    rerender({ on: false });
    frames(500);
    expect(meter(target)).toBe(last);
    expect(result.current.elapsed()).toBe(300);
  });

  it("restart() sets it back to 0", () => {
    const { result } = setup();
    frames(300);
    result.current.restart();
    expect(result.current.elapsed()).toBe(0);
    frames(100);
    expect(result.current.elapsed()).toBe(100);
  });

  it("a hidden tab does not count: elapsed() grows only by the visible time", () => {
    const { result } = setup();
    frames(200);
    setHidden(true);
    vi.advanceTimersByTime(5000);
    setHidden(false);
    frames(100);
    expect(result.current.elapsed()).toBe(300);
  });

  it("cancels its frame on unmount: nothing is written afterwards", () => {
    const { target, unmount } = setup();
    frames(100);
    const last = meter(target);
    unmount();
    expect(queue.size).toBe(0);
    frames(300);
    expect(meter(target)).toBe(last);
  });
});
