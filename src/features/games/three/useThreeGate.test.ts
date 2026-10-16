import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as support from "./support";
import { THREE_TIMEOUT_MS, useThreeGate } from "./useThreeGate";

/** The WebGL2 probe (and the load after it) runs in a task of its own, just after mount. */
const probe = () => act(() => vi.advanceTimersByTime(0));

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
    probe();
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

  it("is off without WebGL2, checked just after mount, and never loads", () => {
    vi.spyOn(support, "canUse3d").mockReturnValue(false);
    const load = vi.fn(() => new Promise<never>(() => {}));
    const { result } = renderHook(() => useThreeGate({ reduced: false, load }));
    expect(result.current.status).toBe("loading");
    probe();
    expect(result.current.status).toBe("off");
    expect(load).not.toHaveBeenCalled();
  });

  it("is off when the load fails", async () => {
    vi.spyOn(support, "canUse3d").mockReturnValue(true);
    const { result } = renderHook(() =>
      useThreeGate({ reduced: false, load: () => Promise.reject(new Error("404")) }),
    );
    probe();
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
    probe();
    await act(async () => {});
    act(() => result.current.fail());
    expect(result.current.status).toBe("off");
  });

  it("after reduced turns off again, it loads again", async () => {
    vi.spyOn(support, "canUse3d").mockReturnValue(true);
    let resolve!: (v: string) => void;
    const pending = () => new Promise<string>((r) => (resolve = r));
    const { result, rerender } = renderHook(
      (p: { reduced: boolean; load: () => Promise<string> }) => useThreeGate(p),
      { initialProps: { reduced: false, load: () => Promise.reject(new Error("404")) } },
    );
    probe();
    await act(async () => {});
    expect(result.current.status).toBe("off");
    rerender({ reduced: true, load: pending });
    expect(result.current.status).toBe("off");
    rerender({ reduced: false, load: pending });
    expect(result.current.status).toBe("loading");
    probe();
    await act(async () => resolve("world"));
    expect(result.current).toMatchObject({ status: "ready", value: "world" });
  });
});
