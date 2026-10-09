import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const load = vi.hoisted(() => vi.fn());
vi.mock("@/lib/motion", () => ({ loadGsap: load, EASE: { swing: "swing" } }));

import { useFlight } from "./useFlight";

/** A GSAP that tweens by hand: `frame(v)` is a frame at progress v, `finish()` the tween's end. */
const tweens: { vars: Record<string, unknown>; target: { value: number }; kill: () => void }[] = [];
const gsap = {
  tag: "gsap",
  to: (target: { value: number }, vars: Record<string, unknown>) => {
    const tween = { vars, target, kill: vi.fn() };
    tweens.push(tween);
    return tween;
  },
};
beforeEach(() => {
  load.mockReset();
  load.mockResolvedValue(gsap);
  tweens.length = 0;
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

  describe("fly", () => {
    const flightOf = <T extends object>(extra: T = {} as T) => ({
      ms: 600,
      place: vi.fn(),
      ...extra,
    });

    it("places the ball at 0, starts it, then follows the tween's progress on the swing ease", async () => {
      const { result } = renderHook(() => useFlight());
      const flight = flightOf({ start: vi.fn() });
      result.current.fly(flight);
      await vi.waitFor(() => expect(tweens).toHaveLength(1));
      expect(flight.place).toHaveBeenCalledWith(0);
      expect(flight.start).toHaveBeenCalledTimes(1);
      const [{ vars, target }] = tweens as [(typeof tweens)[number]];
      expect(vars).toMatchObject({ value: 1, duration: 0.6, ease: "swing" });
      target.value = 0.5;
      (vars.onUpdate as () => void)();
      expect(flight.place).toHaveBeenLastCalledWith(0.5);
    });

    it("at the end it puts the ball away, then calls done", async () => {
      const { result } = renderHook(() => useFlight());
      const order: string[] = [];
      result.current.fly(
        flightOf({ end: () => order.push("end"), done: () => order.push("done") }),
      );
      await vi.waitFor(() => expect(tweens).toHaveLength(1));
      (tweens[0]!.vars.onComplete as () => void)();
      expect(order).toEqual(["end", "done"]);
    });

    it("cut short (stop) it kills the tween and puts the ball away, never calling done", async () => {
      const { result } = renderHook(() => useFlight());
      const end = vi.fn();
      const done = vi.fn();
      result.current.fly(flightOf({ end, done }));
      await vi.waitFor(() => expect(tweens).toHaveLength(1));
      result.current.stop();
      expect(tweens[0]!.kill).toHaveBeenCalledTimes(1);
      expect(end).toHaveBeenCalledTimes(1);
      expect(done).not.toHaveBeenCalled();
    });

    it("if GSAP does not load, done still runs", async () => {
      load.mockRejectedValue(new Error("offline"));
      const { result } = renderHook(() => useFlight());
      const done = vi.fn();
      result.current.fly(flightOf({ done }));
      await vi.waitFor(() => expect(done).toHaveBeenCalledTimes(1));
    });
  });
});
