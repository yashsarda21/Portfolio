import { act, renderHook, waitFor } from "@testing-library/react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setters: Record<string, ReturnType<typeof vi.fn>> = {};
const quickTo = vi.fn((_el: unknown, prop: string) => (setters[prop] = vi.fn()));
const killTweensOf = vi.fn();
vi.mock("gsap", () => ({ gsap: { quickTo, killTweensOf } }));

import { useTilt } from "./useTilt";

function media({ fine, reduced }: { fine: boolean; reduced: boolean }) {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q.includes("pointer: fine") ? fine : q.includes("reduce") ? reduced : false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  }));
}

/** A pointer event over a 400x640 card at the origin. */
const at = (clientX: number, clientY: number, buttons = 0, pointerType = "mouse") =>
  ({
    clientX,
    clientY,
    buttons,
    pointerType,
    currentTarget: {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 640 }),
    },
  }) as unknown as ReactPointerEvent<HTMLElement>;

function setup(touch = false) {
  const el = document.createElement("div");
  const hook = renderHook(() => useTilt({ current: el }, { max: 6, lift: 8, touch }));
  return { ...hook, el };
}

describe("useTilt", () => {
  beforeEach(() => {
    quickTo.mockClear();
    killTweensOf.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("does nothing without a fine pointer", async () => {
    media({ fine: false, reduced: false });
    const { result } = setup();
    act(() => {
      result.current.handlers.onPointerDown(at(100, 100, 1));
      result.current.handlers.onPointerMove(at(300, 300, 1));
    });
    await Promise.resolve();
    expect(quickTo).not.toHaveBeenCalled();
  });

  it("does nothing under reduced motion", async () => {
    media({ fine: true, reduced: true });
    const { result } = setup();
    act(() => {
      result.current.handlers.onPointerDown(at(100, 100, 1));
      result.current.handlers.onPointerMove(at(300, 300, 1));
    });
    await Promise.resolve();
    expect(quickTo).not.toHaveBeenCalled();
  });

  it("tilts toward the pointer (at most max degrees), lifts, and settles on leave", async () => {
    media({ fine: true, reduced: false });
    const { result } = setup();
    act(() => result.current.handlers.onPointerMove(at(400, 320)));
    await waitFor(() => expect(setters.rotationY).toHaveBeenCalledWith(6));
    expect(setters.rotationX).toHaveBeenCalledWith(-0);
    expect(setters.y).toHaveBeenCalledWith(-8);
    act(() => result.current.handlers.onPointerLeave());
    await waitFor(() => expect(setters.rotationY).toHaveBeenLastCalledWith(0));
    expect(setters.y).toHaveBeenLastCalledWith(0);
  });

  it("a press that moves 4px or less is a click, not a drag", () => {
    media({ fine: true, reduced: false });
    const { result } = setup();
    act(() => {
      result.current.handlers.onPointerDown(at(100, 100, 1));
      result.current.handlers.onPointerMove(at(103, 102, 1));
    });
    expect(result.current.consumeDrag()).toBe(false);
  });

  it("a press that moves more than 4px is a drag, and the click after it is swallowed once", () => {
    media({ fine: true, reduced: false });
    const { result } = setup();
    act(() => {
      result.current.handlers.onPointerDown(at(100, 100, 1));
      result.current.handlers.onPointerMove(at(110, 100, 1));
    });
    expect(result.current.consumeDrag()).toBe(true);
    expect(result.current.consumeDrag()).toBe(false);
  });

  it("moving without a press never counts as a drag", () => {
    media({ fine: true, reduced: false });
    const { result } = setup();
    act(() => result.current.handlers.onPointerMove(at(300, 300)));
    expect(result.current.consumeDrag()).toBe(false);
  });

  it("a drag that leaves the card and comes back with the button held still swallows the click", () => {
    media({ fine: true, reduced: false });
    vi.useFakeTimers();
    const { result } = setup();
    act(() => {
      result.current.handlers.onPointerDown(at(100, 100, 1));
      result.current.handlers.onPointerMove(at(160, 100, 1));
      result.current.handlers.onPointerLeave();
    });
    // The leave's own timers run; the visitor drags back over the card and lets go.
    act(() => vi.advanceTimersByTime(10));
    act(() => {
      result.current.handlers.onPointerMove(at(120, 100, 1));
      result.current.handlers.onPointerUp();
    });
    expect(result.current.consumeDrag()).toBe(true);
    vi.useRealTimers();
  });

  it("a drag let go outside the card does not swallow a later keyboard click", () => {
    media({ fine: true, reduced: false });
    const { result } = setup();
    act(() => {
      result.current.handlers.onPointerDown(at(100, 100, 1));
      result.current.handlers.onPointerMove(at(160, 100, 1));
      result.current.handlers.onPointerLeave();
    });
    // The button was released elsewhere. Hovering over the card again (no button) forgets the press...
    act(() => result.current.handlers.onPointerMove(at(300, 300)));
    // ...and a click that comes with no press (Enter on the focused button) is a real click.
    expect(result.current.consumeDrag()).toBe(false);
  });

  describe("touch: true", () => {
    const finger = (x: number, y: number, buttons = 1) => at(x, y, buttons, "touch");

    it("a finger press tilts toward the finger, marks the card pressed, and eases back on release", async () => {
      media({ fine: false, reduced: false });
      const { result, el } = setup(true);
      act(() => result.current.handlers.onPointerDown(finger(400, 320)));
      await waitFor(() => expect(setters.rotationY).toHaveBeenCalledWith(6));
      expect(el.hasAttribute("data-pressed")).toBe(true);
      act(() => result.current.handlers.onPointerUp());
      await waitFor(() => expect(setters.rotationY).toHaveBeenLastCalledWith(0));
      expect(el.hasAttribute("data-pressed")).toBe(false);
    });

    it("a finger that moves while pressed keeps tilting, and a drag swallows the click once", async () => {
      media({ fine: false, reduced: false });
      const { result } = setup(true);
      act(() => {
        result.current.handlers.onPointerDown(finger(200, 320));
        result.current.handlers.onPointerMove(finger(0, 320));
      });
      await waitFor(() => expect(setters.rotationY).toHaveBeenLastCalledWith(-6));
      act(() => result.current.handlers.onPointerUp());
      expect(result.current.consumeDrag()).toBe(true);
      expect(result.current.consumeDrag()).toBe(false);
    });

    it("pointercancel (a scroll took over) settles to 0 and leaves no drag behind", async () => {
      media({ fine: false, reduced: false });
      const { result, el } = setup(true);
      act(() => {
        result.current.handlers.onPointerDown(finger(200, 100));
        result.current.handlers.onPointerMove(finger(200, 300));
      });
      await waitFor(() => expect(setters.rotationX).toHaveBeenCalled());
      act(() => result.current.handlers.onPointerCancel());
      await waitFor(() => expect(setters.rotationY).toHaveBeenLastCalledWith(0));
      expect(setters.rotationX).toHaveBeenLastCalledWith(0);
      expect(el.hasAttribute("data-pressed")).toBe(false);
      expect(result.current.consumeDrag()).toBe(false);
    });

    it("a finger that is not pressing does not tilt", async () => {
      media({ fine: false, reduced: false });
      const { result } = setup(true);
      act(() => result.current.handlers.onPointerMove(finger(300, 300, 0)));
      await Promise.resolve();
      expect(quickTo).not.toHaveBeenCalled();
    });

    it("does nothing under reduced motion", async () => {
      media({ fine: false, reduced: true });
      const { result } = setup(true);
      act(() => result.current.handlers.onPointerDown(finger(300, 300)));
      await Promise.resolve();
      expect(quickTo).not.toHaveBeenCalled();
    });

    it("without the option a finger press does nothing", async () => {
      media({ fine: false, reduced: false });
      const { result, el } = setup(false);
      act(() => {
        result.current.handlers.onPointerDown(finger(100, 100));
        result.current.handlers.onPointerMove(finger(300, 300));
      });
      await Promise.resolve();
      expect(quickTo).not.toHaveBeenCalled();
      expect(el.hasAttribute("data-pressed")).toBe(false);
    });
  });
});
