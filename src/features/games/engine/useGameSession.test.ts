import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MEDIA } from "@/lib/breakpoints";
import { useMatchRecord } from "@/shell/matchRecord";
import { VERDICT_MS } from "./beats";
import { resetLosses } from "./session";
import { useAutoRally, useGameSession } from "./useGameSession";
import { NO_END_FLAGS, type EndFlags } from "./useMatchResult";

vi.mock("@/shell/audio", () => ({ useAudio: () => ({ play: vi.fn() }) }));
vi.mock("@/shell/commentary", () => ({ useCommentary: () => ({ say: vi.fn() }) }));

/** A `matchMedia` whose reduced-motion answer the test can flip. */
const media = { reduced: false, listeners: new Set<() => void>() };
const setReduced = (value: boolean) => {
  media.reduced = value;
  media.listeners.forEach((notify) => notify());
};

beforeEach(() => {
  vi.useFakeTimers();
  media.reduced = false;
  media.listeners.clear();
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return query === MEDIA.reducedMotion ? media.reduced : false;
    },
    addEventListener: (_: string, fn: () => void) => media.listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => media.listeners.delete(fn),
  }));
  useMatchRecord.getState().reset();
  resetLosses();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

interface Run {
  game: number;
  phase: "ready" | "verdict" | "end";
  offerHighlight: boolean;
  fullTime: boolean;
}
const START: Run = { game: 0, phase: "ready", ...NO_END_FLAGS };
const build = (game: number, at: { phase: string } & EndFlags) => ({ game, ...at });

/** A game with one input: whatever lands (a ball in the air, or the game played by itself) ends it at once. */
const setup = () =>
  renderHook(() => {
    const session = useGameSession({ venue: "cricket", start: START, build });
    const land = () => session.finish(1, { score: "0 OUT", form: 0 });
    useAutoRally(session, { play: () => session.timers.after(1000, land) });
    return { session, land };
  });

describe("useGameSession", () => {
  it("finish saves once, calls the verdict, and the end VERDICT_MS later", () => {
    const { result } = setup();
    act(() => result.current.land());
    expect(useMatchRecord.getState().yashWins).toBe(1);
    expect(result.current.session.run.phase).toBe("verdict");
    act(() => void vi.advanceTimersByTime(VERDICT_MS));
    expect(result.current.session.run.phase).toBe("end");
    expect(useMatchRecord.getState().yashWins).toBe(1);
  });

  it("m-1: reduced motion turning on with a ball in the air saves the game once, not twice", () => {
    const { result } = setup();
    // The last ball is in the air (a pending landing) when the setting turns on.
    act(() => result.current.session.timers.after(500, result.current.land));
    act(() => setReduced(true));
    act(() => void vi.advanceTimersByTime(10_000));
    expect(useMatchRecord.getState().yashWins).toBe(1);
    expect(result.current.session.run.phase).toBe("end");
  });

  it("reduced motion turning off again clears the game played by itself", () => {
    const { result } = setup();
    act(() => setReduced(true));
    act(() => setReduced(false));
    act(() => void vi.advanceTimersByTime(10_000));
    expect(useMatchRecord.getState().yashWins).toBe(0);
    expect(result.current.session.run.phase).toBe("ready");
  });

  it("again clears the last game, then starts the next", () => {
    const { result } = setup();
    const restart = vi.fn();
    act(() => result.current.land());
    act(() => result.current.session.again(restart));
    expect(result.current.session.run).toEqual(START);
    expect(restart).toHaveBeenCalledOnce();
    act(() => void vi.advanceTimersByTime(VERDICT_MS));
    expect(result.current.session.run.phase).toBe("ready");
  });
});
