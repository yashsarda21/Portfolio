import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as support from "./support";
import { THREE_TIMEOUT_MS, useThreeGate } from "./useThreeGate";

describe("useThreeGate", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("starts loading, reports progress, then is ready with the value", async () => {
    vi.spyOn(support, "canUse3d").mockReturnValue(true);
    let report!: (f: number) => void;
    let resolve!: (v: string) => void;
    const load = (onProgress: (f: number) => void) =>
      new Promise<string>((r) => ((report = onProgress), (resolve = r)));
    const { result } = renderHook(() => useThreeGate({ reduced: false, load }));
    expect(result.current.status).toBe("loading");
    act(() => report(0.4));
    expect(result.current.progress).toBe(0.4);
    await act(async () => resolve("world"));
    expect(result.current).toMatchObject({ status: "ready", progress: 1, value: "world" });
  });

  it("is off at once with reduced motion, and never loads", () => {
    vi.spyOn(support, "canUse3d").mockReturnValue(true);
    const load = vi.fn(() => new Promise<never>(() => {}));
    const { result } = renderHook(() => useThreeGate({ reduced: true, load }));
    expect(result.current.status).toBe("off");
    expect(load).not.toHaveBeenCalled();
  });

  it("is off at once without WebGL2", () => {
    vi.spyOn(support, "canUse3d").mockReturnValue(false);
    const load = vi.fn(() => new Promise<never>(() => {}));
    const { result } = renderHook(() => useThreeGate({ reduced: false, load }));
    expect(result.current.status).toBe("off");
    expect(load).not.toHaveBeenCalled();
  });

  it("is off when the load fails", async () => {
    vi.spyOn(support, "canUse3d").mockReturnValue(true);
    const { result } = renderHook(() =>
      useThreeGate({ reduced: false, load: () => Promise.reject(new Error("404")) }),
    );
    await act(async () => {});
    expect(result.current.status).toBe("off");
  });

  it("is off after THREE_TIMEOUT_MS, and a late value is ignored", async () => {
    vi.spyOn(support, "canUse3d").mockReturnValue(true);
    let resolve!: (v: string) => void;
    const { result } = renderHook(() =>
      useThreeGate({ reduced: false, load: () => new Promise<string>((r) => (resolve = r)) }),
    );
    act(() => vi.advanceTimersByTime(THREE_TIMEOUT_MS));
    expect(result.current.status).toBe("off");
    await act(async () => resolve("late"));
    expect(result.current.status).toBe("off");
  });

  it("fail() turns a ready gate off", async () => {
    vi.spyOn(support, "canUse3d").mockReturnValue(true);
    const { result } = renderHook(() =>
      useThreeGate({ reduced: false, load: () => Promise.resolve(1) }),
    );
    await act(async () => {});
    act(() => result.current.fail());
    expect(result.current.status).toBe("off");
  });
});
