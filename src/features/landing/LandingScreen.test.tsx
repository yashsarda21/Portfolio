import { render } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { showSchedule } from "@/shell/showSound";
import { WithShell } from "@/shell/storyDecorators";
import { LandingScreen } from "./LandingScreen";

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
vi.mock("@/shell/audio", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shell/audio")>()),
  useAudio: () => audio,
}));
vi.mock("@/lib/motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/motion")>()),
  prefetchGsap: vi.fn(),
}));
vi.mock("./prefetchRig", () => ({ prefetchRig: vi.fn() }));

const root = document.documentElement;
const mount = async () => {
  const utils = render(
    <WithShell>
      <LandingScreen />
    </WithShell>,
  );
  await act(async () => {});
  return utils;
};

beforeEach(() => {
  localStorage.clear();
  window.matchMedia = ((query: string) => ({
    matches: query.includes("min-width: 1200px"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia;
  Object.assign(audio, { enabled: true, unlocked: true });
  for (const fn of [audio.unlock, audio.playShow, audio.prefetchShow, audio.stopShow])
    fn.mockReset();
});
afterEach(() => {
  root.removeAttribute("data-return-visit");
  root.style.removeProperty("--pace");
});

describe("the Home's sound", () => {
  it("a first visit is silent, even with sound unlocked, but fetches the recordings for the Intro", async () => {
    await mount();
    expect(audio.prefetchShow).toHaveBeenCalled();
    expect(audio.playShow).not.toHaveBeenCalled();
    expect(audio.unlock).not.toHaveBeenCalled();
  });

  it("a return visit cheers: the crowd alone, on the fast pace's beats", async () => {
    root.setAttribute("data-return-visit", "");
    root.style.setProperty("--pace", "0.25");
    await mount();
    expect(audio.playShow).toHaveBeenCalledTimes(1);
    expect(audio.playShow.mock.calls[0]![0]).toEqual(showSchedule("landing", { pace: 0.25 }));
    expect(audio.playShow.mock.calls[0]![0]).toHaveLength(1);
  });

  it("leaving the Home ends its sound", async () => {
    const { unmount } = await mount();
    unmount();
    expect(audio.stopShow).toHaveBeenCalledWith(300);
  });
});
