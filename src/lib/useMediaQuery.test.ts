import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "./useMediaQuery";

afterEach(() => vi.unstubAllGlobals());

function stub(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return matches;
    },
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }));
  return {
    set(next: boolean) {
      matches = next;
      listeners.forEach((fn) => fn());
    },
    listeners,
  };
}

describe("useMediaQuery", () => {
  it("reads the query", () => {
    stub(true);
    expect(renderHook(() => useMediaQuery("(min-width: 1200px)")).result.current).toBe(true);
  });

  it("follows changes", () => {
    const mq = stub(false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 1200px)"));
    expect(result.current).toBe(false);
    act(() => mq.set(true));
    expect(result.current).toBe(true);
  });

  it("stops listening on unmount", () => {
    const mq = stub(false);
    const { unmount } = renderHook(() => useMediaQuery("(min-width: 1200px)"));
    expect(mq.listeners.size).toBe(1);
    unmount();
    expect(mq.listeners.size).toBe(0);
  });

  it("is false where matchMedia does not exist", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(renderHook(() => useMediaQuery("(min-width: 1200px)")).result.current).toBe(false);
  });
});
