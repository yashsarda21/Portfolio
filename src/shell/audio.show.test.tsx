import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioProvider, useAudio } from "./audio";
import { SHOW_FILES, SHOW_LEVELS, showSchedule, type ShowCue } from "./showSound";

const wrapper = ({ children }: { children: ReactNode }) => (
  <AudioProvider>{children}</AudioProvider>
);

/** Records what the show asked of the audio graph. */
interface Gain {
  value: number;
  setValueAtTime: ReturnType<typeof vi.fn>;
  linearRampToValueAtTime: ReturnType<typeof vi.fn>;
  cancelScheduledValues: ReturnType<typeof vi.fn>;
}
interface Node {
  gain?: Gain;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  buffer?: unknown;
  start?: ReturnType<typeof vi.fn>;
  stop?: ReturnType<typeof vi.fn>;
  onended?: () => void;
}
const rig = {
  time: 100,
  gains: [] as Node[],
  sources: [] as Node[],
  decodes: 0,
  decodeFails: false,
  fetches: [] as string[],
  fetchFails: false,
  /** A file whose fetch waits here (by path) until the test lets it go. */
  gates: {} as Record<string, Promise<void>>,
};

const makeGain = (): Gain => ({
  value: 1,
  setValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
  cancelScheduledValues: vi.fn(),
});

class FakeAudioContext {
  state = "running";
  destination = {};
  get currentTime() {
    return rig.time;
  }
  resume = vi.fn(() => Promise.resolve());
  createGain() {
    const node: Node = { gain: makeGain(), connect: vi.fn(), disconnect: vi.fn() };
    rig.gains.push(node);
    return node;
  }
  createDynamicsCompressor() {
    return {
      threshold: { value: 0 },
      knee: { value: 0 },
      ratio: { value: 0 },
      attack: { value: 0 },
      release: { value: 0 },
      connect: vi.fn(),
    };
  }
  createBufferSource() {
    const node: Node = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    rig.sources.push(node);
    return node;
  }
  decodeAudioData(data: ArrayBuffer) {
    rig.decodes++;
    return rig.decodeFails
      ? Promise.reject(new Error("bad audio"))
      : Promise.resolve({ decoded: data.byteLength });
  }
}

/** Waits for the fetch and decode promises. */
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

beforeEach(() => {
  localStorage.clear();
  rig.time = 100;
  rig.gains = [];
  rig.sources = [];
  rig.decodes = 0;
  rig.decodeFails = false;
  rig.fetches = [];
  rig.fetchFails = false;
  rig.gates = {};
  delete document.documentElement.dataset.showScheduled;
  vi.stubGlobal("AudioContext", FakeAudioContext);
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      rig.fetches.push(url);
      if (rig.fetchFails) return Promise.reject(new Error("offline"));
      const response = { ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) };
      return (rig.gates[url] ?? Promise.resolve()).then(() => response);
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

/** A fixed show to test the service with: four clunks, then a crowd (the Home's first-show timings, as numbers). */
const LAND: ShowCue[] = [
  ...[0.6, 1.1, 1.6, 2.0].map((at): ShowCue => ({ at, sound: "light" })),
  { at: 2.4, sound: "crowd", fadeIn: 0.6, holdUntil: 4.5, fadeOut: 1.5 },
];

function unlocked() {
  const hook = renderHook(() => useAudio(), { wrapper });
  act(() => hook.result.current.unlock());
  return hook;
}

/** The start times given to the buffer sources, in the order they were made. */
const starts = () => rig.sources.map((s) => s.start!.mock.calls[0]![0] as number);

describe("playShow", () => {
  it("fetches and decodes each recording once, however many cues use it", async () => {
    const { result } = unlocked();
    act(() => result.current.playShow(LAND, performance.now()));
    await settle();
    expect(rig.fetches.sort()).toEqual([SHOW_FILES.crowd, SHOW_FILES.light]);
    expect(rig.decodes).toBe(2);
    act(() => result.current.playShow(LAND, performance.now()));
    await settle();
    expect(rig.decodes).toBe(2);
  });

  it("fetches nothing before it is asked to play a show (first-load stays light)", () => {
    unlocked();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("schedules each cue on the audio clock: currentTime + at", async () => {
    const { result } = unlocked();
    act(() => result.current.playShow(LAND, performance.now()));
    await settle();
    // Four clunks, then the crowd.
    const [a, b, c, d, crowd] = starts();
    expect(a).toBeCloseTo(100.6, 1);
    expect(b).toBeCloseTo(101.1, 1);
    expect(c).toBeCloseTo(101.6, 1);
    expect(d).toBeCloseTo(102.0, 1);
    expect(crowd).toBeCloseTo(102.4, 1);
  });

  it("puts the show on its own bus (0.8) into the master gain; a clunk sits at 0.6 of it", async () => {
    const { result } = unlocked();
    act(() => result.current.playShow(LAND, performance.now()));
    await settle();
    const master = rig.gains[0]!;
    const bus = rig.gains[1]!;
    expect(bus.gain!.value).toBe(SHOW_LEVELS.bus);
    expect(SHOW_LEVELS.bus).toBe(0.8);
    expect(bus.connect).toHaveBeenCalledWith(master);
    expect(rig.gains[2]!.gain!.value).toBe(SHOW_LEVELS.light);
    expect(SHOW_LEVELS.light).toBe(0.6);
  });

  it("shapes the crowd: up to full by the name, held, then down over the fade", async () => {
    const { result } = unlocked();
    act(() => result.current.playShow(LAND, performance.now()));
    await settle();
    const crowd = rig.gains[rig.gains.length - 1]!.gain!;
    expect(crowd.setValueAtTime.mock.calls[0]).toEqual([0, expect.closeTo(102.4, 1)]);
    const ramps = crowd.linearRampToValueAtTime.mock.calls;
    expect(ramps[0]![0]).toBe(1);
    expect(ramps[0]![1]).toBeCloseTo(103.0, 1);
    expect(crowd.setValueAtTime.mock.calls[1]).toEqual([1, expect.closeTo(104.5, 1)]);
    expect(ramps[1]![0]).toBe(0);
    expect(ramps[1]![1]).toBeCloseTo(106.0, 1);
    expect(SHOW_LEVELS.crowd).toBe(1);
  });

  it("schedules each sound as soon as its own file is ready: the clunks never wait for the crowd", async () => {
    let release!: () => void;
    rig.gates[SHOW_FILES.crowd] = new Promise<void>((resolve) => (release = resolve));
    const { result } = unlocked();
    act(() => result.current.playShow(LAND, performance.now()));
    await settle();
    // The crowd is still on its way: the four clunks are already placed, on a bus that already exists.
    expect(rig.sources).toHaveLength(4);
    expect(starts()[0]).toBeCloseTo(100.6, 1);
    const bus = rig.gains[1]!;
    expect(bus.gain!.value).toBe(SHOW_LEVELS.bus);
    expect(bus.connect).toHaveBeenCalledWith(rig.gains[0]);
    release();
    await settle();
    // Then the crowd joins the same bus.
    expect(rig.sources).toHaveLength(5);
    expect(starts()[4]).toBeCloseTo(102.4, 1);
    expect(rig.gains.filter((g) => g.connect.mock.calls.some(([to]) => to === bus))).toHaveLength(
      5,
    );
    expect(rig.gains.filter((g) => g.gain!.value === SHOW_LEVELS.bus)).toHaveLength(1);
  });

  it("a show stopped while the crowd is still on its way never starts the crowd, and fades the bus", async () => {
    let release!: () => void;
    rig.gates[SHOW_FILES.crowd] = new Promise<void>((resolve) => (release = resolve));
    const { result } = unlocked();
    act(() => result.current.playShow(LAND, performance.now()));
    await settle();
    act(() => result.current.stopShow());
    expect(rig.gains[1]!.gain!.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 100.3);
    release();
    await settle();
    expect(rig.sources).toHaveLength(4);
  });

  it("skips a clunk whose time has already passed, because the file was still decoding", async () => {
    const { result } = unlocked();
    // The show began 0.9 s ago: the clunks at 0.6 s is past, 1.1 s is still to come.
    act(() => result.current.playShow(LAND, performance.now() - 900));
    await settle();
    expect(rig.sources).toHaveLength(4); // 3 clunks + the crowd
    expect(starts()[0]).toBeCloseTo(100.2, 1);
  });

  it("joins the crowd part-way if it is late, with the swell where it has got to", async () => {
    const { result } = unlocked();
    act(() => result.current.playShow(LAND, performance.now() - 2700));
    await settle();
    const crowd = rig.gains[rig.gains.length - 1]!.gain!;
    expect(crowd.setValueAtTime.mock.calls[0]![0]).toBeCloseTo(0.5, 1);
    expect(starts().at(-1)).toBeCloseTo(100, 1);
  });

  it("plays nothing of a crowd whose whole run has passed", async () => {
    const { result } = unlocked();
    act(() => result.current.playShow(LAND, performance.now() - 7000));
    await settle();
    expect(rig.sources).toHaveLength(0);
  });

  it("plays nothing while muted, and nothing before an unlock", async () => {
    const hook = renderHook(() => useAudio(), { wrapper });
    act(() => hook.result.current.playShow(LAND, performance.now()));
    await settle();
    expect(fetch).not.toHaveBeenCalled();
    act(() => hook.result.current.unlock());
    act(() => hook.result.current.toggle());
    act(() => hook.result.current.playShow(LAND, performance.now()));
    await settle();
    expect(fetch).not.toHaveBeenCalled();
    expect(rig.sources).toHaveLength(0);
  });

  it("stays silent, with no console output, when the fetch fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    rig.fetchFails = true;
    const { result } = unlocked();
    act(() => result.current.playShow(LAND, performance.now()));
    await settle();
    expect(rig.sources).toHaveLength(0);
    expect(log).not.toHaveBeenCalled();
  });

  it("stays silent when a file cannot be decoded, and tries again next time", async () => {
    rig.decodeFails = true;
    const { result } = unlocked();
    act(() => result.current.playShow(LAND, performance.now()));
    await settle();
    expect(rig.sources).toHaveLength(0);
    rig.decodeFails = false;
    act(() => result.current.playShow(LAND, performance.now()));
    await settle();
    expect(rig.sources.length).toBeGreaterThan(0);
  });

  it("plays only the crowd of a return visit's cheer", async () => {
    const { result } = unlocked();
    const cues = showSchedule("landing", { pace: 0.25 });
    act(() => result.current.playShow(cues, performance.now()));
    await settle();
    expect(rig.fetches).toEqual([SHOW_FILES.crowd]);
    expect(rig.sources).toHaveLength(1);
  });

  it("notes how many cues were scheduled on the page, for tests", () => {
    const { result } = unlocked();
    act(() => result.current.playShow(LAND, performance.now()));
    expect(document.documentElement.dataset.showScheduled).toBe("5");
  });

  it("ignores an empty show", async () => {
    const { result } = unlocked();
    act(() => result.current.playShow([] as ShowCue[], performance.now()));
    await settle();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("stopShow", () => {
  it("ramps the show bus to 0 over the fade (300 ms by default) and stops the sources just after", async () => {
    const { result } = unlocked();
    act(() => result.current.playShow(LAND, performance.now()));
    await settle();
    const bus = rig.gains[1]!.gain!;
    act(() => result.current.stopShow());
    expect(bus.cancelScheduledValues).toHaveBeenCalledWith(100);
    expect(bus.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 100.3);
    for (const source of rig.sources)
      expect(source.stop).toHaveBeenCalledWith(expect.closeTo(100.32, 5));
  });

  it("takes the fade as milliseconds", async () => {
    const { result } = unlocked();
    act(() => result.current.playShow(LAND, performance.now()));
    await settle();
    act(() => result.current.stopShow(1000));
    expect(rig.gains[1]!.gain!.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 101);
  });

  it("a show stopped while its files are still decoding never starts", async () => {
    const { result } = unlocked();
    act(() => result.current.playShow(LAND, performance.now()));
    act(() => result.current.stopShow());
    await settle();
    expect(rig.sources).toHaveLength(0);
  });

  it("fades the show out when the tab is hidden", async () => {
    const { result } = unlocked();
    act(() => result.current.playShow(LAND, performance.now()));
    await settle();
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    expect(rig.gains[1]!.gain!.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 100.3);
  });

  it("does nothing when no show is playing", () => {
    const { result } = unlocked();
    expect(() => act(() => result.current.stopShow())).not.toThrow();
  });

  it("a new show ends the one before it", async () => {
    const { result } = unlocked();
    act(() => result.current.playShow(LAND, performance.now()));
    await settle();
    act(() => result.current.playShow(LAND, performance.now()));
    await settle();
    expect(rig.gains[1]!.gain!.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 100.03);
  });
});
