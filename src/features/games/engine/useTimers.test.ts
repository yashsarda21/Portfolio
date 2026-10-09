import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTimers } from "./useTimers";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useTimers", () => {
  it("runs a timer after its delay", () => {
    const { result } = renderHook(() => useTimers());
    const fn = vi.fn();
    result.current.after(200, fn);
    vi.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("clear() stops every pending timer", () => {
    const { result } = renderHook(() => useTimers());
    const a = vi.fn();
    const b = vi.fn();
    result.current.after(100, a);
    result.current.after(300, b);
    result.current.clear();
    vi.advanceTimersByTime(1000);
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  it("timers set after a clear() still run", () => {
    const { result } = renderHook(() => useTimers());
    const fn = vi.fn();
    result.current.clear();
    result.current.after(100, fn);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("unmounting stops every pending timer", () => {
    const { result, unmount } = renderHook(() => useTimers());
    const fn = vi.fn();
    result.current.after(100, fn);
    unmount();
    vi.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();
  });
});
