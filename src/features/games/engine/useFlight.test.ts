import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const load = vi.hoisted(() => vi.fn());
vi.mock("@/lib/motion", () => ({ loadGsap: load }));

import { useFlight } from "./useFlight";

const gsap = { tag: "gsap" };
beforeEach(() => {
  load.mockReset();
  load.mockResolvedValue(gsap);
});

describe("useFlight", () => {
  it("builds the tween with GSAP once it has loaded", async () => {
    const { result } = renderHook(() => useFlight());
    const build = vi.fn(() => () => {});
    result.current.play(build);
    await vi.waitFor(() => expect(build).toHaveBeenCalledWith(gsap));
  });

  it("stop() kills the flight in the air", async () => {
    const { result } = renderHook(() => useFlight());
    const kill = vi.fn();
    result.current.play(() => kill);
    await vi.waitFor(() => expect(load).toHaveBeenCalled());
    await Promise.resolve();
    result.current.stop();
    expect(kill).toHaveBeenCalledTimes(1);
  });

  it("a flight stopped before GSAP arrives is never built", async () => {
    const { result } = renderHook(() => useFlight());
    const build = vi.fn(() => () => {});
    result.current.play(build);
    result.current.stop();
    await Promise.resolve();
    await Promise.resolve();
    expect(build).not.toHaveBeenCalled();
  });

  it("a new flight kills the one before it", async () => {
    const { result } = renderHook(() => useFlight());
    const first = vi.fn();
    result.current.play(() => first);
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    result.current.play(() => () => {});
    expect(first).toHaveBeenCalledTimes(1);
  });

  it("leaving kills the flight in the air", async () => {
    const { result, unmount } = renderHook(() => useFlight());
    const kill = vi.fn();
    result.current.play(() => kill);
    await vi.waitFor(() => expect(load).toHaveBeenCalled());
    await Promise.resolve();
    unmount();
    expect(kill).toHaveBeenCalledTimes(1);
  });

  it("runs onFail when GSAP does not load, unless the flight was stopped", async () => {
    load.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useFlight());
    const failed = vi.fn();
    result.current.play(() => () => {}, failed);
    await vi.waitFor(() => expect(failed).toHaveBeenCalledTimes(1));

    const stopped = vi.fn();
    result.current.play(() => () => {}, stopped);
    result.current.stop();
    await Promise.resolve();
    await Promise.resolve();
    expect(stopped).not.toHaveBeenCalled();
  });
});
