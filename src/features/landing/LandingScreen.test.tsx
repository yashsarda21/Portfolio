import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ui } from "@/content";
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
const start = ui.landing.start;

function matchMedia(desktop: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("min-width: 1200px") ? desktop : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia;
}
const mount = () =>
  render(
    <WithShell>
      <LandingScreen />
    </WithShell>,
  );

beforeEach(() => {
  localStorage.clear();
  matchMedia(true);
  Object.assign(audio, { enabled: true, unlocked: false });
  for (const fn of [audio.toggle, audio.unlock, audio.play, audio.playShow, audio.stopShow])
    fn.mockReset();
});
afterEach(() => {
  root.classList.remove("js");
  root.removeAttribute("data-return-visit");
  root.removeAttribute("data-started");
  document.querySelectorAll("[inert]").forEach((el) => el.removeAttribute("inert"));
});

describe("the first-visit start screen", () => {
  beforeEach(() => root.classList.add("js"));

  it("is a modal dialog, with focus on SOUND ON and the page behind shut", () => {
    mount();
    const dialog = screen.getByRole("dialog", { name: start.label });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: start.soundOn })).toHaveFocus();
    expect(screen.getByRole("button", { name: start.silent })).toBeInTheDocument();
    expect(document.getElementById("main")).toHaveProperty("inert", true);
    expect(dialog).toHaveAccessibleDescription(start.note);
  });

  it("adds no heading: the page's own h1 stays the only one", () => {
    mount();
    expect(screen.getByRole("dialog").querySelector("h1, h2, h3")).toBeNull();
  });

  it("KICK OFF · SOUND ON starts the boot, unlocks the sound and plays the whole show", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: start.soundOn }));
    expect(root).toHaveAttribute("data-started");
    expect(audio.unlock).toHaveBeenCalled();
    expect(audio.toggle).not.toHaveBeenCalled();
    expect(audio.playShow).toHaveBeenCalledTimes(1);
    const [schedule, startAt] = audio.playShow.mock.calls[0]!;
    expect(schedule).toEqual(
      showSchedule("landing", { tier: "desktop", pace: 1, firstShow: true }),
    );
    expect(startAt).toBeCloseTo(performance.now(), -3);
    expect(document.getElementById("main")).toHaveProperty("inert", false);
  });

  it("on a phone the show has two clunks (the column has two banks)", () => {
    matchMedia(false);
    mount();
    fireEvent.click(screen.getByRole("button", { name: start.soundOn }));
    const cues = audio.playShow.mock.calls[0]![0] as { sound: string }[];
    expect(cues.filter((c) => c.sound === "light")).toHaveLength(2);
  });

  it("with the sound saved off, SOUND ON turns it on (which unlocks it)", () => {
    audio.enabled = false;
    mount();
    fireEvent.click(screen.getByRole("button", { name: start.soundOn }));
    expect(audio.toggle).toHaveBeenCalledTimes(1);
    expect(audio.playShow).toHaveBeenCalled();
  });

  it("KICK OFF IN SILENCE starts the boot with the sound toggle off, and plays nothing", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: start.silent }));
    expect(root).toHaveAttribute("data-started");
    expect(audio.toggle).toHaveBeenCalledTimes(1);
    expect(audio.playShow).not.toHaveBeenCalled();
  });

  it("IN SILENCE leaves a sound that is already off alone", () => {
    audio.enabled = false;
    mount();
    fireEvent.click(screen.getByRole("button", { name: start.silent }));
    expect(audio.toggle).not.toHaveBeenCalled();
  });

  it("the Enter shortcut does not leave the Landing while the start screen is up", () => {
    mount();
    expect(root).not.toHaveAttribute("data-started");
    act(() => void fireEvent.keyDown(document.body, { key: "Enter" }));
    expect(audio.unlock).not.toHaveBeenCalled();
  });

  it("ends the show's sound when the visitor leaves the page", () => {
    const { unmount } = mount();
    unmount();
    expect(audio.stopShow).toHaveBeenCalledWith(300);
  });
});

describe("a return visit", () => {
  beforeEach(() => {
    root.classList.add("js");
    root.setAttribute("data-return-visit", "");
  });

  it("has no start screen to meet: the page behind is open and nothing is focused for it", () => {
    mount();
    expect(document.getElementById("main")).not.toHaveProperty("inert", true);
    expect(screen.getByRole("dialog", { hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: start.soundOn, hidden: true })).not.toHaveFocus();
  });

  it("is silent when sound is not unlocked yet (a reload)", () => {
    mount();
    expect(audio.playShow).not.toHaveBeenCalled();
  });

  it("cheers alone, at the scaled beats, when sound is already unlocked in this page session", () => {
    audio.unlocked = true;
    root.style.setProperty("--pace", "0.25");
    mount();
    expect(audio.playShow).toHaveBeenCalledTimes(1);
    expect(audio.playShow.mock.calls[0]![0]).toEqual(
      showSchedule("landing", { tier: "desktop", pace: 0.25, firstShow: false }),
    );
    root.style.removeProperty("--pace");
  });
});
