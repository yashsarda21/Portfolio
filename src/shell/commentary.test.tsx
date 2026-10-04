import { act, render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommentaryProvider, CommentarySlot, useCommentary } from "./commentary";

const wrapper = ({ children }: { children: ReactNode }) => (
  <CommentaryProvider>{children}</CommentaryProvider>
);

describe("commentary service", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("holds a line for 4s, then exits and clears", () => {
    const { result } = renderHook(() => useCommentary(), { wrapper });
    act(() => result.current.say("Still not out."));
    expect(result.current.current).toEqual({ line: "Still not out.", state: "in" });
    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.current?.state).toBe("out");
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.current).toBeNull();
  });

  it("keeps only the latest pending line and shows it next", () => {
    const { result } = renderHook(() => useCommentary(), { wrapper });
    act(() => {
      result.current.say("A");
      result.current.say("B");
      result.current.say("C");
    });
    expect(result.current.current?.line).toBe("A");
    act(() => vi.advanceTimersByTime(4300));
    expect(result.current.current).toEqual({ line: "C", state: "in" });
  });

  it("interrupt swaps the line after a short exit", () => {
    const { result } = renderHook(() => useCommentary(), { wrapper });
    act(() => result.current.say("Old"));
    act(() => result.current.say("New", { interrupt: true }));
    expect(result.current.current).toEqual({ line: "Old", state: "out" });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.current).toEqual({ line: "New", state: "in" });
  });

  it("mirrors the line into a polite live region", () => {
    function Speaker() {
      const { say } = useCommentary();
      return <button onClick={() => say("Career high score updated.")}>speak</button>;
    }
    render(
      <CommentaryProvider>
        <Speaker />
        <CommentarySlot tag="COMM" />
      </CommentaryProvider>,
    );
    act(() => screen.getByText("speak").click());
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live).toHaveTextContent("Career high score updated.");
  });
});
