import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioProvider, useAudio } from "./audio";
import { MASTER_GAIN, RECIPES } from "./synth";

vi.mock("./synth", async (importOriginal) => {
  const real = await importOriginal<typeof import("./synth")>();
  return { ...real, RECIPES: { ...real.RECIPES, bat: vi.fn() } };
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <AudioProvider>{children}</AudioProvider>
);

/** The master gain's parameter and the context, so a test can see what the provider asked of them. */
const rig = {
  setValueAtTime: vi.fn(),
  gainValue: 0,
  state: "running",
  resume: vi.fn(() => Promise.resolve()),
  created: 0,
};

class FakeAudioContext {
  currentTime = 12;
  destination = {};
  get state() {
    return rig.state;
  }
  resume = rig.resume;
  constructor() {
    rig.created++;
  }
  createGain() {
    return {
      gain: {
        set value(v: number) {
          rig.gainValue = v;
        },
        setValueAtTime: rig.setValueAtTime,
      },
      connect: vi.fn(),
    };
  }
}

beforeEach(() => {
  localStorage.clear();
  rig.setValueAtTime.mockClear();
  rig.resume.mockClear();
  rig.state = "running";
  rig.created = 0;
  vi.mocked(RECIPES.bat).mockClear();
  vi.stubGlobal("AudioContext", FakeAudioContext);
});
afterEach(() => vi.unstubAllGlobals());

describe("audio service", () => {
  it("defaults to enabled but locked until a user gesture", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    expect(result.current.enabled).toBe(true);
    expect(result.current.unlocked).toBe(false);
  });

  it("toggling persists the preference", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    act(() => result.current.toggle());
    expect(result.current.enabled).toBe(false);
    expect(localStorage.getItem("arena:audio")).toBe("off");
  });

  it("plays nothing before unlock", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    act(() => result.current.play("bat"));
    expect(RECIPES.bat).not.toHaveBeenCalled();
  });

  it("after unlock, play runs the recipe into the master gain a moment ahead", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    act(() => result.current.unlock());
    act(() => result.current.play("bat"));
    expect(RECIPES.bat).toHaveBeenCalledTimes(1);
    const [, out, at] = vi.mocked(RECIPES.bat).mock.calls[0]!;
    expect(out).toHaveProperty("gain");
    expect(at).toBeCloseTo(12.005);
    expect(rig.gainValue).toBe(MASTER_GAIN);
  });

  it("plays nothing while muted, and muting silences the master gain at once", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    act(() => result.current.unlock());
    act(() => result.current.toggle());
    expect(rig.setValueAtTime).toHaveBeenLastCalledWith(0, 12);
    act(() => result.current.play("bat"));
    expect(RECIPES.bat).not.toHaveBeenCalled();
    act(() => result.current.toggle());
    expect(rig.setValueAtTime).toHaveBeenLastCalledWith(MASTER_GAIN, 12);
  });

  it("resumes a suspended context before playing (iOS)", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    act(() => result.current.unlock());
    rig.state = "suspended";
    act(() => result.current.play("bat"));
    expect(rig.resume).toHaveBeenCalled();
  });

  it("stays silent, with no console output, when there is no AudioContext", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("AudioContext", undefined);
    delete (window as unknown as Record<string, unknown>).AudioContext;
    const { result } = renderHook(() => useAudio(), { wrapper });
    act(() => result.current.unlock());
    expect(() => act(() => result.current.play("bat"))).not.toThrow();
    expect(RECIPES.bat).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it("stays silent, with no console output, when the AudioContext constructor throws", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "AudioContext",
      class {
        constructor() {
          throw new Error("blocked");
        }
      },
    );
    const { result } = renderHook(() => useAudio(), { wrapper });
    act(() => result.current.unlock());
    expect(() => act(() => result.current.play("bat"))).not.toThrow();
    expect(RECIPES.bat).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it("has no sound files or fetching left", async () => {
    const mod = await import("./audio");
    expect("SOUND_FILES" in mod).toBe(false);
  });
});
