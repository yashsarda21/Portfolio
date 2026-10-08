import { act, renderHook, waitFor } from "@testing-library/react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { tweens, setAngle, fake, loadGsap } = vi.hoisted(() => {
  type Tween = {
    kill: () => void;
    pause: () => void;
    play: () => void;
    progress: (v: number) => void;
  };
  const tweens: Tween[] = [];
  const setAngle = vi.fn();
  const fake = {
    fromTo: vi.fn(() => {
      const t = { kill: vi.fn(), pause: vi.fn(), play: vi.fn(), progress: vi.fn() };
      tweens.push(t);
      return t;
    }),
    to: vi.fn(() => ({ kill: vi.fn() })),
    quickTo: vi.fn(() => setAngle),
    killTweensOf: vi.fn(),
    set: vi.fn(),
  };
  return { tweens, setAngle, fake, loadGsap: vi.fn(() => Promise.resolve(fake)) };
});
vi.mock("@/lib/motion", () => ({ loadGsap, EASE: { follow: "follow", swing: "swing" } }));

import { useOrbit } from "./useOrbit";

function media({ reduced = false, coarse = false } = {}) {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q.includes("reduce")
      ? reduced
      : q.includes("pointer: coarse")
        ? coarse
        : q.includes("pointer: fine")
          ? !coarse
          : false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  }));
}

/** A pointer event over a 1000px-wide plate. `target` is what was pressed. */
function ev(
  clientX: number,
  opts: { buttons?: number; pointerType?: string; target?: Element } = {},
) {
  const plate = document.createElement("div");
  plate.getBoundingClientRect = () => ({ width: 1000 }) as DOMRect;
  plate.setPointerCapture = vi.fn();
  return {
    clientX,
    clientY: 0,
    buttons: opts.buttons ?? 0,
    pointerId: 1,
    pointerType: opts.pointerType ?? "mouse",
    target: opts.target ?? plate,
    currentTarget: plate,
  } as unknown as ReactPointerEvent<HTMLElement>;
}

function setup(options: Parameters<typeof useOrbit>[1] = {}) {
  const plate = document.createElement("div");
  plate.getBoundingClientRect = () => ({ width: 1000 }) as DOMRect;
  plate.setPointerCapture = vi.fn();
  const hook = renderHook(() => useOrbit({ current: plate }, options));
  return { ...hook, plate };
}
const orbit = (plate: HTMLElement) => plate.dataset.orbit;

describe("useOrbit", () => {
  beforeEach(() => {
    tweens.length = 0;
    for (const f of [setAngle, loadGsap, ...Object.values(fake)]) f.mockClear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("does not sway under reduced motion", async () => {
    media({ reduced: true });
    const { plate } = setup();
    await Promise.resolve();
    expect(loadGsap).not.toHaveBeenCalled();
    expect(orbit(plate)).toBe("rest");
  });

  it("does not sway when disabled", async () => {
    media();
    const { plate } = setup({ enabled: false });
    await Promise.resolve();
    expect(loadGsap).not.toHaveBeenCalled();
    expect(orbit(plate)).toBe("rest");
  });

  it("sways on a touch-only device (a coarse pointer)", async () => {
    media({ coarse: true });
    const { plate } = setup();
    await waitFor(() => expect(orbit(plate)).toBe("sway"));
  });

  it("starts the sway from the middle: -sway to +sway over half the period, forever", async () => {
    media();
    const { plate } = setup({ sway: 6, period: 40 });
    await waitFor(() => expect(orbit(plate)).toBe("sway"));
    expect(fake.fromTo).toHaveBeenCalledWith(
      plate,
      { rotationY: -6 },
      expect.objectContaining({ rotationY: 6, duration: 20, yoyo: true, repeat: -1 }),
    );
    expect(tweens[0]?.progress).toHaveBeenCalledWith(0.5);
  });

  it("a pointer move pauses the sway, and it resumes after resumeAfter seconds", async () => {
    media();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { plate, result } = setup({ resumeAfter: 4 });
    await waitFor(() => expect(orbit(plate)).toBe("sway"));
    act(() => result.current.onPointerMove(ev(100)));
    expect(orbit(plate)).toBe("rest");
    expect(tweens[0]?.pause).toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(3900));
    expect(orbit(plate)).toBe("rest");
    act(() => vi.advanceTimersByTime(200));
    expect(orbit(plate)).toBe("sway");
    expect(tweens[0]?.play).toHaveBeenCalled();
  });

  for (const pointerType of ["mouse", "touch"]) {
    it(`${pointerType}: a press moved 20px is a drag that turns the plate and swallows the click once`, async () => {
      media();
      const { plate, result } = setup();
      await waitFor(() => expect(orbit(plate)).toBe("sway"));
      act(() => {
        result.current.onPointerDown(ev(100, { buttons: 1, pointerType }));
        result.current.onPointerMove(ev(120, { buttons: 1, pointerType }));
      });
      expect(orbit(plate)).toBe("drag");
      // 20px of a 1000px plate: 20 / 500 * 15 degrees.
      expect(setAngle).toHaveBeenLastCalledWith(0.6);
      act(() => result.current.onPointerUp());
      expect(result.current.consumeDrag()).toBe(true);
      expect(result.current.consumeDrag()).toBe(false);
    });
  }

  it("a press on a link or button never starts a drag", async () => {
    media();
    const { plate, result } = setup();
    await waitFor(() => expect(orbit(plate)).toBe("sway"));
    const link = document.createElement("a");
    const inner = document.createElement("span");
    link.append(inner);
    act(() => {
      result.current.onPointerDown(ev(100, { buttons: 1, target: inner }));
      result.current.onPointerMove(ev(300, { buttons: 1, target: inner }));
    });
    expect(orbit(plate)).not.toBe("drag");
    expect(result.current.consumeDrag()).toBe(false);
  });

  it("a press that moves 4px or less is not a drag", async () => {
    media();
    const { plate, result } = setup();
    await waitFor(() => expect(orbit(plate)).toBe("sway"));
    act(() => {
      result.current.onPointerDown(ev(100, { buttons: 1 }));
      result.current.onPointerMove(ev(103, { buttons: 1 }));
    });
    expect(orbit(plate)).not.toBe("drag");
  });

  it("pointerup eases back to 0 and the sway resumes after resumeAfter", async () => {
    media();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { plate, result } = setup({ resumeAfter: 4 });
    await waitFor(() => expect(orbit(plate)).toBe("sway"));
    act(() => {
      result.current.onPointerDown(ev(100, { buttons: 1 }));
      result.current.onPointerMove(ev(300, { buttons: 1 }));
      result.current.onPointerUp();
    });
    expect(fake.to).toHaveBeenCalledWith(
      plate,
      expect.objectContaining({ rotationY: 0, duration: 0.6 }),
    );
    expect(orbit(plate)).toBe("rest");
    act(() => vi.advanceTimersByTime(4100));
    expect(orbit(plate)).toBe("sway");
  });

  it("a touch press that turns into a vertical scroll (pointercancel) eases back and resumes", async () => {
    media();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { plate, result } = setup({ resumeAfter: 4 });
    await waitFor(() => expect(orbit(plate)).toBe("sway"));
    act(() => {
      result.current.onPointerDown(ev(100, { buttons: 1, pointerType: "touch" }));
      result.current.onPointerMove(ev(130, { buttons: 1, pointerType: "touch" }));
      result.current.onPointerCancel();
    });
    expect(fake.to).toHaveBeenCalledWith(plate, expect.objectContaining({ rotationY: 0 }));
    expect(result.current.consumeDrag()).toBe(false);
    act(() => vi.advanceTimersByTime(4100));
    expect(orbit(plate)).toBe("sway");
  });

  it("losing the pointer capture mid-drag ends the drag: it eases back, the press is forgotten, the sway resumes", async () => {
    media();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { plate, result } = setup({ resumeAfter: 4 });
    await waitFor(() => expect(orbit(plate)).toBe("sway"));
    act(() => {
      result.current.onPointerDown(ev(100, { buttons: 1 }));
      result.current.onPointerMove(ev(300, { buttons: 1 }));
    });
    expect(orbit(plate)).toBe("drag");
    fake.to.mockClear();
    act(() => result.current.onLostPointerCapture());
    expect(fake.to).toHaveBeenCalledWith(plate, expect.objectContaining({ rotationY: 0 }));
    expect(orbit(plate)).toBe("rest");
    act(() => vi.advanceTimersByTime(4100));
    expect(orbit(plate)).toBe("sway");
    // A plain move pauses the sway again: the press is not stuck.
    act(() => result.current.onPointerMove(ev(500)));
    expect(orbit(plate)).toBe("rest");
  });

  it("the lost-capture that follows a normal release changes nothing", async () => {
    media();
    const { plate, result } = setup();
    await waitFor(() => expect(orbit(plate)).toBe("sway"));
    act(() => {
      result.current.onPointerDown(ev(100, { buttons: 1 }));
      result.current.onPointerMove(ev(300, { buttons: 1 }));
      result.current.onPointerUp();
    });
    fake.to.mockClear();
    act(() => result.current.onLostPointerCapture());
    expect(fake.to).not.toHaveBeenCalled();
  });

  it("leaving the plate mid-drag ends it when the pointer is not captured, and not when it is", async () => {
    media();
    const { plate, result } = setup();
    await waitFor(() => expect(orbit(plate)).toBe("sway"));
    act(() => {
      result.current.onPointerDown(ev(100, { buttons: 1 }));
      result.current.onPointerMove(ev(300, { buttons: 1 }));
    });
    const captured = ev(300, { buttons: 1 });
    (captured.currentTarget as HTMLElement).hasPointerCapture = () => true;
    act(() => result.current.onPointerLeave(captured));
    expect(orbit(plate)).toBe("drag");
    act(() => result.current.onPointerLeave(ev(300, { buttons: 1 })));
    expect(orbit(plate)).toBe("rest");
    expect(fake.to).toHaveBeenCalledWith(plate, expect.objectContaining({ rotationY: 0 }));
  });

  it("unmounting kills every tween and clears the timers", async () => {
    media();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { plate, result, unmount } = setup();
    await waitFor(() => expect(orbit(plate)).toBe("sway"));
    act(() => result.current.onPointerMove(ev(100)));
    unmount();
    expect(tweens[0]?.kill).toHaveBeenCalled();
    expect(fake.killTweensOf).toHaveBeenCalledWith(plate);
    expect(vi.getTimerCount()).toBe(0);
  });
});
