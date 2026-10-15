import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ShowCue } from "./showSound";
import { useShowSound } from "./useShowSound";

const audio = vi.hoisted(() => ({
  enabled: true,
  unlocked: false,
  toggle: vi.fn(),
  unlock: vi.fn(),
  play: vi.fn(),
  playShow: vi.fn(),
  prefetchShow: vi.fn(),
  stopShow: vi.fn(),
}));
vi.mock("./audio", () => ({ useAudio: () => audio }));

const SHOW: ShowCue[] = [
  { at: 0.2, sound: "light" },
  { at: 1, sound: "crowd", fadeIn: 1, holdUntil: 2, fadeOut: 1 },
];
const listeners = () =>
  vi.mocked(document.addEventListener).mock.calls.filter(([, , o]) => typeof o === "object");

const flush = () => act(async () => {});
const mount = () => renderHook(() => useShowSound());

beforeEach(() => {
  Object.assign(audio, { enabled: true, unlocked: false });
  for (const fn of [audio.unlock, audio.playShow, audio.prefetchShow, audio.stopShow])
    fn.mockReset();
  vi.spyOn(document, "addEventListener");
  vi.spyOn(document, "removeEventListener");
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("useShowSound", () => {
  it("prefetches the recordings as soon as the screen mounts, and makes no sound context", () => {
    mount();
    expect(audio.prefetchShow).toHaveBeenCalledTimes(1);
    expect(audio.unlock).not.toHaveBeenCalled();
  });

  it("an empty show (reduced motion, a first visit's Home) waits for nothing: no listeners, no sound", async () => {
    const { result } = mount();
    act(() => result.current.arm([], 0));
    await flush();
    expect(listeners()).toHaveLength(0);
    expect(audio.playShow).not.toHaveBeenCalled();
    expect(audio.unlock).not.toHaveBeenCalled();
  });

  it("plays at once when sound is already unlocked (the visitor clicked inside the site)", async () => {
    audio.unlocked = true;
    const { result } = mount();
    const startAt = performance.now();
    act(() => result.current.arm(SHOW, startAt));
    await flush();
    expect(audio.playShow).toHaveBeenCalledWith(SHOW, startAt);
    expect(audio.unlock).not.toHaveBeenCalled();
    expect(listeners()).toHaveLength(0);
  });

  it("plays at once, unlocking, where the browser allows autoplay", async () => {
    vi.stubGlobal("navigator", { getAutoplayPolicy: () => "allowed" });
    const { result } = mount();
    act(() => result.current.arm(SHOW, performance.now()));
    await flush();
    expect(audio.unlock).toHaveBeenCalledTimes(1);
    expect(audio.playShow).toHaveBeenCalledTimes(1);
  });

  it("otherwise waits for the first gesture: listens once, in capture, passively, for the four gestures", async () => {
    const { result } = mount();
    act(() => result.current.arm(SHOW, performance.now()));
    await flush();
    expect(audio.playShow).not.toHaveBeenCalled();
    expect(listeners().map(([type]) => type)).toEqual([
      "pointerdown",
      "keydown",
      "touchend",
      "click",
    ]);
    for (const [, , options] of listeners())
      expect(options).toEqual({ capture: true, passive: true });
  });

  it("the first gesture unlocks and plays the show from its own zero, then the listeners are gone", async () => {
    const { result } = mount();
    const startAt = performance.now() - 300;
    act(() => result.current.arm(SHOW, startAt));
    await flush();
    act(() => void document.dispatchEvent(new Event("pointerdown")));
    expect(audio.unlock).toHaveBeenCalledTimes(1);
    expect(audio.playShow).toHaveBeenCalledWith(SHOW, startAt);
    expect(vi.mocked(document.removeEventListener)).toHaveBeenCalledTimes(4);
    act(() => void document.dispatchEvent(new Event("click")));
    expect(audio.playShow).toHaveBeenCalledTimes(1);
  });

  it("stops listening when the show is over", async () => {
    vi.useFakeTimers();
    const { result } = mount();
    act(() => result.current.arm(SHOW, performance.now()));
    await act(async () => {
      await Promise.resolve();
    });
    expect(listeners()).toHaveLength(4);
    // The crowd's fade ends at 3 s.
    act(() => void vi.advanceTimersByTime(3100));
    expect(vi.mocked(document.removeEventListener)).toHaveBeenCalledTimes(4);
    act(() => void document.dispatchEvent(new Event("click")));
    expect(audio.playShow).not.toHaveBeenCalled();
  });

  it("does not listen at all for a show that is already over", async () => {
    const { result } = mount();
    act(() => result.current.arm(SHOW, performance.now() - 5000));
    await flush();
    expect(listeners()).toHaveLength(0);
    expect(audio.playShow).not.toHaveBeenCalled();
  });

  it("leaving the screen drops the listeners and fades a playing show out", async () => {
    const { result, unmount } = mount();
    act(() => result.current.arm(SHOW, performance.now()));
    await flush();
    unmount();
    expect(vi.mocked(document.removeEventListener)).toHaveBeenCalledTimes(4);
    expect(audio.stopShow).toHaveBeenCalledWith(300);
    act(() => void document.dispatchEvent(new Event("click")));
    expect(audio.playShow).not.toHaveBeenCalled();
  });

  it("arming again (REPLAY) replaces the earlier wait", async () => {
    const { result } = mount();
    act(() => result.current.arm(SHOW, performance.now()));
    await flush();
    act(() => result.current.arm(SHOW, performance.now()));
    await flush();
    act(() => void document.dispatchEvent(new Event("keydown")));
    expect(audio.playShow).toHaveBeenCalledTimes(1);
  });
});
