import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRun } from "./useRun";

describe("useRun", () => {
  it("starts at the start, and merges patches", () => {
    const { result } = renderHook(() => useRun({ phase: "ready", n: 0 }));
    expect(result.current.run).toEqual({ phase: "ready", n: 0 });
    act(() => result.current.commit({ n: 1 }));
    expect(result.current.run).toEqual({ phase: "ready", n: 1 });
  });

  it("`latest` is current the moment commit returns, before any render", () => {
    const { result } = renderHook(() => useRun({ phase: "ready" }));
    act(() => {
      result.current.commit({ phase: "flight" });
      // A second handler in the same tick already sees the first one's phase.
      expect(result.current.latest.current.phase).toBe("flight");
    });
  });

  it("commit keeps one identity, so an effect that lists it never re-runs", () => {
    const { result, rerender } = renderHook(() => useRun({ n: 0 }));
    const first = result.current.commit;
    rerender();
    expect(result.current.commit).toBe(first);
  });
});
