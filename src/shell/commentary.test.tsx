import { act, render, renderHook, screen } from "@testing-library/react";
import { StrictMode, useEffect, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommentaryProvider, CommentarySlot, useCommentary } from "./commentary";

const wrapper = ({ children }: { children: ReactNode }) => (
  <CommentaryProvider>{children}</CommentaryProvider>
);
// Strict mode double-runs effects (setup, cleanup, setup) as `react-router dev` does. RTL's own flag
// is used because a <StrictMode> wrapper passed to renderHook does not double-run the hook's effects.
const strict = { wrapper, reactStrictMode: true };

describe("commentary service", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("holds a line for 4s, then exits and clears", () => {
    const { result } = renderHook(() => useCommentary(), strict);
    act(() => result.current.say("Still not out."));
    expect(result.current.current).toEqual({ line: "Still not out.", state: "in" });
    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.current?.state).toBe("out");
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.current).toBeNull();
  });

  it("still clears a line said from a mount effect under strict mode", () => {
    // The page's effect runs before the provider's, so strict mode's cleanup lands after say().
    function Opener() {
      const { say } = useCommentary();
      useEffect(() => say("Welcome."), [say]);
      return null;
    }
    const { result } = renderHook(() => useCommentary(), {
      reactStrictMode: true,
      wrapper: ({ children }) => (
        <CommentaryProvider>
          <Opener />
          {children}
        </CommentaryProvider>
      ),
    });
    expect(result.current.current).toEqual({ line: "Welcome.", state: "in" });
    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.current?.state).toBe("out");
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.current).toBeNull();
  });

  it("keeps only the latest pending line and shows it next", () => {
    const { result } = renderHook(() => useCommentary(), strict);
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
    const { result } = renderHook(() => useCommentary(), strict);
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
      <StrictMode>
        <CommentaryProvider>
          <Speaker />
          <CommentarySlot tag="COMM" />
        </CommentaryProvider>
      </StrictMode>,
    );
    act(() => screen.getByText("speak").click());
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live).toHaveTextContent("Career high score updated.");
  });

  describe("below md (phones are silent)", () => {
    function phone(on: boolean) {
      vi.stubGlobal("matchMedia", (q: string) => ({
        matches: on && q === "(max-width: 767px)",
        media: q,
        addEventListener() {},
        removeEventListener() {},
      }));
    }
    afterEach(() => vi.unstubAllGlobals());

    it("queues and announces nothing on a phone", () => {
      phone(true);
      const { result } = renderHook(() => useCommentary(), strict);
      act(() => result.current.say("Still not out."));
      expect(result.current.current).toBeNull();
      act(() => vi.advanceTimersByTime(5000));
      expect(result.current.current).toBeNull();
    });

    it("keeps the live region empty on a phone", () => {
      phone(true);
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
      expect(document.querySelector('[aria-live="polite"]')).toBeEmptyDOMElement();
    });

    it("is unchanged at md and up", () => {
      phone(false);
      const { result } = renderHook(() => useCommentary(), strict);
      act(() => result.current.say("Still not out."));
      expect(result.current.current).toEqual({ line: "Still not out.", state: "in" });
    });
  });
});
