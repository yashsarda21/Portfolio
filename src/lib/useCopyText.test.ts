import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCopyText } from "./useCopyText";

const TEXT = "https://example.dev/scout";

function setClipboard(clipboard: unknown) {
  Object.defineProperty(navigator, "clipboard", { value: clipboard, configurable: true });
}

describe("useCopyText", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    setClipboard(undefined);
  });

  it("starts idle", () => {
    const { result } = renderHook(() => useCopyText());
    expect(result.current.state).toBe("idle");
  });

  it("copies the text, says it is copied, and goes back to idle after 2 seconds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    const { result } = renderHook(() => useCopyText());

    await act(() => result.current.copy(TEXT));
    expect(writeText).toHaveBeenCalledWith(TEXT);
    expect(result.current.state).toBe("copied");

    act(() => vi.advanceTimersByTime(1999));
    expect(result.current.state).toBe("copied");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.state).toBe("idle");
  });

  it("a second copy restarts the 2 seconds", async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    const { result } = renderHook(() => useCopyText());
    await act(() => result.current.copy(TEXT));
    act(() => vi.advanceTimersByTime(1500));
    await act(() => result.current.copy(TEXT));
    act(() => vi.advanceTimersByTime(1500));
    expect(result.current.state).toBe("copied");
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.state).toBe("idle");
  });

  it("falls back, without throwing, when the clipboard rejects", async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new DOMException("denied")) });
    const { result } = renderHook(() => useCopyText());
    await act(() => result.current.copy(TEXT));
    expect(result.current.state).toBe("fallback");
    // The fallback stays up: the visitor needs time to copy the text by hand.
    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.state).toBe("fallback");
  });

  it("falls back, without throwing, when there is no clipboard at all", async () => {
    setClipboard(undefined);
    const { result } = renderHook(() => useCopyText());
    await act(() => result.current.copy(TEXT));
    expect(result.current.state).toBe("fallback");
  });

  it("falls back when writeText throws at once", async () => {
    setClipboard({
      writeText: () => {
        throw new Error("insecure context");
      },
    });
    const { result } = renderHook(() => useCopyText());
    await act(() => result.current.copy(TEXT));
    expect(result.current.state).toBe("fallback");
  });

  it("clears its timer on unmount", async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    const { result, unmount } = renderHook(() => useCopyText());
    await act(() => result.current.copy(TEXT));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("hands out a ref that focuses and selects the field as it arrives", () => {
    const { result } = renderHook(() => useCopyText());
    const input = document.createElement("input");
    input.value = TEXT;
    document.body.append(input);
    result.current.field(input);
    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(TEXT.length);
    input.remove();
  });
});
