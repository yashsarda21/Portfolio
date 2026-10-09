import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const say = vi.hoisted(() => vi.fn());
const load = vi.hoisted(() => vi.fn());
vi.mock("@/shell/commentary", () => ({ useCommentary: () => ({ say }) }));
vi.mock("@/lib/motion", () => ({ loadGsap: load }));

import { useArrival } from "./useArrival";

beforeEach(() => {
  say.mockReset();
  load.mockReset();
  load.mockResolvedValue({});
});

describe("useArrival", () => {
  it("says the line once, when it is spoken, however often it re-renders", () => {
    const { rerender } = renderHook((p) => useArrival(p), {
      initialProps: { line: "Hello.", spoken: false, reduced: false },
    });
    expect(say).not.toHaveBeenCalled();
    rerender({ line: "Hello.", spoken: true, reduced: false });
    rerender({ line: "Hello.", spoken: true, reduced: false });
    expect(say).toHaveBeenCalledTimes(1);
    expect(say).toHaveBeenCalledWith("Hello.");
  });

  it("warms GSAP unless motion is reduced", () => {
    renderHook(() => useArrival({ line: "x", spoken: true, reduced: false }));
    expect(load).toHaveBeenCalledTimes(1);
    renderHook(() => useArrival({ line: "x", spoken: true, reduced: true }));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("does not mind GSAP failing to load", async () => {
    load.mockRejectedValue(new Error("offline"));
    renderHook(() => useArrival({ line: "x", spoken: false, reduced: false }));
    await Promise.resolve();
    await Promise.resolve();
  });
});
