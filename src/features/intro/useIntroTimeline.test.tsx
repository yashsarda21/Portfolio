import { act, render } from "@testing-library/react";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { WithShell } from "@/shell/storyDecorators";
import { INTRO_BEATS } from "./beats";
import { IntroPage } from "./IntroPage";
import { RIG_WAIT_MS } from "./rigGate";
import { useIntroTimeline } from "./useIntroTimeline";
import { buildIntroView } from "./view";

const loadRig = vi.hoisted(() => vi.fn());
/** A test can hold GSAP back (as a slow network would) by putting a promise here. */
const held = vi.hoisted(() => ({ gsap: null as Promise<unknown> | null }));
vi.mock("./rig", () => ({ loadRig }));
/** The sound the lights make is the only audio call the show makes: watch it, leave the rest of the service as is. */
const play = vi.hoisted(() => vi.fn());
vi.mock("@/shell/audio", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shell/audio")>()),
  useAudio: () => ({ enabled: true, unlocked: true, toggle: vi.fn(), unlock: vi.fn(), play }),
}));
vi.mock("@/lib/motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/motion")>()),
  loadGsap: () => held.gsap ?? Promise.resolve(gsap),
}));

const view = buildIntroView(content, ui, ROUTES);

const QUERY = {
  desktop: "(min-width: 1200px) and (prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 1199px) and (prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
} as const;

let current: keyof typeof QUERY = "desktop";
const listeners = new Set<() => void>();

/** matchMedia that answers for one situation: which of the three tier queries is true. */
function situation(active: keyof typeof QUERY) {
  current = active;
  listeners.clear();
  window.matchMedia = ((query: string) => {
    const mq = {
      get matches() {
        return query === QUERY[current];
      },
      media: query,
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
      addListener: (fn: () => void) => listeners.add(fn),
      removeListener: (fn: () => void) => listeners.delete(fn),
    };
    return mq;
  }) as unknown as typeof window.matchMedia;
}

/** The window changes width or motion preference: every query listener is told. */
async function changeTo(active: keyof typeof QUERY) {
  current = active;
  await act(async () => {
    for (const fn of [...listeners]) fn();
  });
}

const seen: { api?: ReturnType<typeof useIntroTimeline> } = {};
/** The hook's latest answer. */
const api = {
  replay: () => seen.api!.replay(),
  get canReplay() {
    return seen.api!.canReplay;
  },
};
/** How often the page rendered: the hook must not re-render it at every beat. */
let renders = 0;
const onComm = vi.fn();

function Harness() {
  const root = useRef<HTMLElement>(null);
  const hook = useIntroTimeline(root, { onComm });
  renders++;
  useEffect(() => {
    seen.api = hook;
  });
  return (
    <IntroPage view={view} rootRef={root} onReplay={hook.canReplay ? hook.replay : undefined} />
  );
}

async function mount() {
  const utils = render(
    <WithShell>
      <Harness />
    </WithShell>,
  );
  // The GSAP loader resolves in a microtask; let the effect finish.
  await act(async () => {});
  return { ...utils, root: utils.container.querySelector("main#main") as HTMLElement };
}

const timelines = () => gsap.globalTimeline.getChildren(false, false, true);

beforeEach(() => {
  // The dust canvas has no 2D context in jsdom; it is not what these tests look at.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  renders = 0;
  loadRig.mockReset();
  loadRig.mockReturnValue(Promise.resolve("ready"));
  onComm.mockReset();
  play.mockReset();
});
afterEach(() => {
  gsap.globalTimeline.clear();
  held.gsap = null;
  delete (Element.prototype as Partial<Element>).getAnimations;
});

const replayButtons = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLButtonElement>("button")].filter(
    (b) => b.textContent === view.replay,
  );

describe("useIntroTimeline", () => {
  it("desktop (1200px and up): loads the rig, plays, and marks the root playing", async () => {
    situation("desktop");
    const { root } = await mount();
    expect(loadRig).toHaveBeenCalledTimes(1);
    const [urls, opts] = loadRig.mock.calls[0]!;
    expect(urls).toHaveLength(3);
    expect(urls.map((u: string) => u.match(/turn_(\d)/)![1])).toEqual(["0", "1", "2"]);
    // up to the performance beat, plus the 1.5 s the timeline will wait there
    expect(opts).toEqual({ timeoutMs: INTRO_BEATS.desktop.performance * 1000 + RIG_WAIT_MS });
    expect(root).toHaveAttribute("data-hold", "playing");
    expect(root).toHaveAttribute("data-sprites", "ready");
    expect(timelines()).toHaveLength(1);
  });

  it("the commentary beat and the end of the show reach the screen", async () => {
    situation("desktop");
    const { root } = await mount();
    const tl = timelines()[0] as gsap.core.Timeline;
    tl.pause();
    act(() => void tl.progress(1));
    expect(onComm).toHaveBeenCalledTimes(1);
    expect(root).toHaveAttribute("data-hold", "done");
  });

  it("REPLAY restarts the same show, playing again, and only one timeline exists", async () => {
    situation("desktop");
    const { root } = await mount();
    const tl = timelines()[0] as gsap.core.Timeline;
    tl.pause();
    act(() => void tl.progress(1));
    expect(root).toHaveAttribute("data-hold", "done");
    act(() => api.replay());
    expect(root).toHaveAttribute("data-hold", "playing");
    expect(tl.time()).toBeLessThan(0.5);
    for (let i = 0; i < 5; i++) act(() => api.replay());
    expect(timelines()).toHaveLength(1);
    expect(loadRig).toHaveBeenCalledTimes(1);
  });

  it("the floodlight sound plays once per show, though four banks light, and again on REPLAY", async () => {
    situation("desktop");
    await mount();
    const tl = timelines()[0] as gsap.core.Timeline;
    tl.pause();
    act(() => void tl.progress(1));
    expect(play.mock.calls).toEqual([["floodlight"]]);
    act(() => api.replay());
    tl.pause();
    act(() => void tl.progress(1));
    expect(play.mock.calls).toEqual([["floodlight"], ["floodlight"]]);
  });

  it("the phone's cut lights the floodlights with the sound too; reduced motion has no beat, so none", async () => {
    situation("mobile");
    await mount();
    const tl = timelines()[0] as gsap.core.Timeline;
    tl.pause();
    act(() => void tl.progress(1));
    expect(play.mock.calls).toEqual([["floodlight"]]);
  });

  it("reduced motion makes no sound", async () => {
    situation("reduce");
    await mount();
    expect(play).not.toHaveBeenCalled();
  });

  it("reduced motion: the end state at once, the rig never loaded, no timeline", async () => {
    situation("reduce");
    const { root } = await mount();
    expect(loadRig).not.toHaveBeenCalled();
    expect(root).not.toHaveAttribute("data-sprites");
    expect(root).toHaveAttribute("data-hold", "done");
    expect(timelines()).toHaveLength(0);
    const letters = root.querySelectorAll('[data-part="letter"]');
    expect([...letters].every((l) => l.getAttribute("data-lit") === "done")).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-part="cta"]')!.style.visibility).not.toBe(
      "hidden",
    );
    // the head turn is not drawn; the rest pose stands
    for (const strip of root.querySelectorAll<HTMLElement>('[data-part="turn"]'))
      expect(strip.style.visibility).toBe("hidden");
    expect(root.querySelector<HTMLElement>('[data-part="rest"]')!.style.visibility).not.toBe(
      "hidden",
    );
    // the phone's column is at its end state too (the width can change under reduced motion)
    const column = root.querySelector('[data-intro-layout="column"]')!;
    const phoneLetters = column.querySelectorAll('[data-part="letter"]');
    expect([...phoneLetters].every((l) => l.getAttribute("data-lit") === "done")).toBe(true);
    for (const part of ["cta", "welcome", "portrait", "board-strip"])
      expect(
        column.querySelector<HTMLElement>(`[data-part="${part}"]`)!.style.visibility,
        part,
      ).not.toBe("hidden");
  });

  it("phone width: plays the column's cut, never loads the rig, and says nothing on the commentary beat", async () => {
    situation("mobile");
    const { root } = await mount();
    expect(loadRig).not.toHaveBeenCalled();
    expect(root).not.toHaveAttribute("data-sprites");
    expect(root).toHaveAttribute("data-hold", "playing");
    expect(timelines()).toHaveLength(1);
    const tl = timelines()[0] as gsap.core.Timeline;
    tl.pause();
    act(() => void tl.progress(1));
    expect(onComm).not.toHaveBeenCalled();
    expect(root).toHaveAttribute("data-hold", "done");
  });

  it("each layout's timeline touches its own parts only: the same data-part names, two layouts", async () => {
    const part = (layout: string, name: string) =>
      document.querySelector<HTMLElement>(`[data-intro-layout="${layout}"] [data-part="${name}"]`)!;
    const ofLayout = (layout: string) => [
      ...document.querySelectorAll<HTMLElement>(`[data-intro-layout="${layout}"] [data-part]`),
    ];
    const tweened = (layout: string) =>
      ofLayout(layout).filter((el) => gsap.getTweensOf(el).length > 0);

    situation("mobile");
    const phone = await mount();
    expect(tweened("column").length).toBeGreaterThan(10);
    expect(tweened("stage")).toEqual([]);
    expect(gsap.getTweensOf(part("column", "cta")).length).toBeGreaterThan(0);
    expect(gsap.getTweensOf(part("stage", "cta"))).toHaveLength(0);
    phone.unmount();
    gsap.globalTimeline.clear();

    situation("desktop");
    await mount();
    expect(tweened("stage").length).toBeGreaterThan(10);
    expect(tweened("column")).toEqual([]);
    expect(gsap.getTweensOf(part("column", "letter"))).toHaveLength(0);
  });

  it("phone REPLAY restarts the same cut from the dark", async () => {
    situation("mobile");
    const { root } = await mount();
    const tl = timelines()[0] as gsap.core.Timeline;
    tl.pause();
    act(() => void tl.progress(1));
    expect(root).toHaveAttribute("data-hold", "done");
    act(() => api.replay());
    expect(root).toHaveAttribute("data-hold", "playing");
    expect(tl.time()).toBeLessThan(0.5);
    for (let i = 0; i < 5; i++) act(() => api.replay());
    expect(timelines()).toHaveLength(1);
  });

  it("resizing from the stage to the phone mid-play builds the column's show and reaches done", async () => {
    situation("desktop");
    const { root } = await mount();
    const stageTl = timelines()[0] as gsap.core.Timeline;
    stageTl.time(1);
    expect(root).toHaveAttribute("data-sprites");

    await changeTo("mobile");
    expect(root).not.toHaveAttribute("data-sprites");
    expect(root).toHaveAttribute("data-hold", "playing");
    expect(timelines()).toHaveLength(1);
    expect(timelines()[0]).not.toBe(stageTl);
    expect(
      gsap.getTweensOf(document.querySelector('[data-intro-layout="stage"] [data-part="cta"]')!),
    ).toHaveLength(0);
    const tl = timelines()[0] as gsap.core.Timeline;
    tl.pause();
    act(() => void tl.progress(1));
    expect(root).toHaveAttribute("data-hold", "done");

    // and back again
    await changeTo("desktop");
    expect(root).toHaveAttribute("data-hold", "playing");
    expect(timelines()).toHaveLength(1);
    expect(root).toHaveAttribute("data-sprites");
  });

  it("leaving the page reverts the show: no tween is left on the unmounted nodes", async () => {
    situation("desktop");
    const { unmount } = await mount();
    expect(timelines()).toHaveLength(1);
    const root = document.querySelector("main#main")!;
    unmount();
    expect(timelines()).toHaveLength(0);
    expect(root).not.toHaveAttribute("data-sprites");
  });
  it("REPLAY is disabled until the timeline exists, and live once the show plays", async () => {
    situation("desktop");
    let release: () => void = () => {};
    held.gsap = new Promise((resolve) => (release = () => resolve(gsap)));
    const { root } = await mount();
    expect(root).toHaveAttribute("data-hold", "pending");
    const buttons = replayButtons(root);
    expect(buttons).toHaveLength(2);
    for (const b of buttons) expect(b).toHaveAttribute("aria-disabled", "true");
    // inert: a click does nothing (there is nothing to restart)
    act(() => buttons[0]!.click());
    expect(timelines()).toHaveLength(0);
    expect(root).toHaveAttribute("data-hold", "pending");

    held.gsap = null;
    await act(async () => release());
    expect(root).toHaveAttribute("data-hold", "playing");
    for (const b of replayButtons(root)) expect(b).not.toHaveAttribute("aria-disabled");
    const tl = timelines()[0] as gsap.core.Timeline;
    tl.pause();
    act(() => void tl.progress(1));
    act(() => replayButtons(root)[0]!.click());
    expect(root).toHaveAttribute("data-hold", "playing");
    expect(tl.time()).toBeLessThan(0.5);
  });

  it("REPLAY stays disabled when GSAP never arrives", async () => {
    situation("desktop");
    held.gsap = Promise.reject(new Error("offline"));
    held.gsap.catch(() => {});
    const { root } = await mount();
    expect(root).toHaveAttribute("data-hold", "pending");
    for (const b of replayButtons(root)) expect(b).toHaveAttribute("aria-disabled", "true");
  });

  it("the page is not re-rendered at every beat of the show", async () => {
    situation("desktop");
    await mount();
    const tl = timelines()[0] as gsap.core.Timeline;
    tl.pause();
    const before = renders;
    act(() => void tl.progress(1));
    act(() => api.replay());
    expect(renders).toBe(before);
  });

  describe("GSAP arriving after the 8 s CSS fallback has shown the parts (M8)", () => {
    const withFallback = (playState: "finished" | "running") => {
      (Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => [
        { animationName: "hold-fallback", playState },
      ];
    };

    it("shows the end state at once instead of hiding the parts and replaying them", async () => {
      situation("desktop");
      withFallback("finished");
      const { root } = await mount();
      expect(root).toHaveAttribute("data-hold", "done");
      expect(timelines()).toHaveLength(0);
      expect(loadRig).not.toHaveBeenCalled();
      expect(root).not.toHaveAttribute("data-sprites");
      const stage = root.querySelector('[data-intro-layout="stage"]')!;
      const letters = stage.querySelectorAll('[data-part="letter"]');
      expect([...letters].every((l) => l.getAttribute("data-lit") === "done")).toBe(true);
      for (const part of ["cta", "welcome", "mover", "rest", "board-strip"])
        expect(
          stage.querySelector<HTMLElement>(`[data-part="${part}"]`)!.style.visibility,
        ).not.toBe("hidden");
      // nothing to replay: the button says so
      for (const b of replayButtons(root)) expect(b).toHaveAttribute("aria-disabled", "true");
    });

    it("an animation still waiting for its 8 s does not count: the show plays", async () => {
      situation("desktop");
      withFallback("running");
      const { root } = await mount();
      expect(root).toHaveAttribute("data-hold", "playing");
      expect(timelines()).toHaveLength(1);
    });

    it("the phone's column is treated the same", async () => {
      situation("mobile");
      withFallback("finished");
      const { root } = await mount();
      expect(root).toHaveAttribute("data-hold", "done");
      expect(timelines()).toHaveLength(0);
    });
  });
});
