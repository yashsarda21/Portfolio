import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCopyLink } from "./useCopyLink";

const URL = "https://example.dev/scout";
const COPY = { done: "LINK COPIED ✓", fallback: "COPY THIS LINK" };

function setClipboard(clipboard: unknown) {
  Object.defineProperty(navigator, "clipboard", { value: clipboard, configurable: true });
}

describe("useCopyLink", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    setClipboard(undefined);
  });

  it("starts idle with no message", () => {
    const { result } = renderHook(() => useCopyLink(URL, COPY));
    expect(result.current.state).toBe("idle");
    expect(result.current.message).toBeUndefined();
  });

  it("copies the url, says it is copied, and goes back to idle after 2 seconds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    const { result } = renderHook(() => useCopyLink(URL, COPY));

    await act(() => result.current.copy());
    expect(writeText).toHaveBeenCalledWith(URL);
    expect(result.current.state).toBe("copied");
    expect(result.current.message).toBe(COPY.done);

    act(() => vi.advanceTimersByTime(1999));
    expect(result.current.state).toBe("copied");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.state).toBe("idle");
    expect(result.current.message).toBeUndefined();
  });

  it("a second copy restarts the 2 seconds", async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    const { result } = renderHook(() => useCopyLink(URL, COPY));
    await act(() => result.current.copy());
    act(() => vi.advanceTimersByTime(1500));
    await act(() => result.current.copy());
    act(() => vi.advanceTimersByTime(1500));
    expect(result.current.state).toBe("copied");
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.state).toBe("idle");
  });

  it("falls back, without throwing, when the clipboard rejects", async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new DOMException("denied")) });
    const { result } = renderHook(() => useCopyLink(URL, COPY));
    await act(() => result.current.copy());
    expect(result.current.state).toBe("fallback");
    expect(result.current.message).toBe(COPY.fallback);
    // The fallback stays up: the visitor needs time to copy the text by hand.
    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.state).toBe("fallback");
  });

  it("falls back, without throwing, when there is no clipboard at all", async () => {
    setClipboard(undefined);
    const { result } = renderHook(() => useCopyLink(URL, COPY));
    await act(() => result.current.copy());
    expect(result.current.state).toBe("fallback");
  });

  it("falls back when writeText throws at once", async () => {
    setClipboard({
      writeText: () => {
        throw new Error("insecure context");
      },
    });
    const { result } = renderHook(() => useCopyLink(URL, COPY));
    await act(() => result.current.copy());
    expect(result.current.state).toBe("fallback");
  });

  it("clears its timer on unmount", async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    const { result, unmount } = renderHook(() => useCopyLink(URL, COPY));
    await act(() => result.current.copy());
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
