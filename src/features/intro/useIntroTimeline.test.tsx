import { act, render } from "@testing-library/react";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { WithShell } from "@/shell/storyDecorators";
import { INTRO_BEATS } from "./beats";
import { IntroPage } from "./IntroPage";
import { useIntroTimeline } from "./useIntroTimeline";
import { buildIntroView } from "./view";

const loadRig = vi.hoisted(() => vi.fn());
vi.mock("./rig", () => ({ loadRig }));
vi.mock("@/lib/motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/motion")>()),
  loadGsap: () => Promise.resolve(gsap),
}));

const view = buildIntroView(content, ui, ROUTES);

const QUERY = {
  desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
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
  get state() {
    return seen.api!.state;
  },
};
const onComm = vi.fn();

function Harness() {
  const root = useRef<HTMLElement>(null);
  const hook = useIntroTimeline(root, { onComm });
  useEffect(() => {
    seen.api = hook;
  });
  return <IntroPage view={view} rootRef={root} onReplay={hook.replay} />;
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
  loadRig.mockReset();
  loadRig.mockReturnValue(Promise.resolve("ready"));
  onComm.mockReset();
});
afterEach(() => {
  gsap.globalTimeline.clear();
});

describe("useIntroTimeline", () => {
  it("desktop (and tablet): loads the rig, plays, and marks the root playing", async () => {
    situation("desktop");
    const { root } = await mount();
    expect(loadRig).toHaveBeenCalledTimes(1);
    const [urls, opts] = loadRig.mock.calls[0]!;
    expect(urls).toHaveLength(3);
    expect(urls.map((u: string) => u.match(/turn_(\d)/)![1])).toEqual(["0", "1", "2"]);
    // up to the performance beat, plus the 1.5 s the timeline will wait there
    expect(opts).toEqual({ timeoutMs: (INTRO_BEATS.desktop.performance + 1.5) * 1000 });
    expect(root).toHaveAttribute("data-intro", "playing");
    expect(root).toHaveAttribute("data-rig");
    expect(api.state).toBe("playing");
    expect(timelines()).toHaveLength(1);
  });

  it("the commentary beat and the end of the show reach the screen", async () => {
    situation("desktop");
    const { root } = await mount();
    const tl = timelines()[0] as gsap.core.Timeline;
    tl.pause();
    act(() => void tl.progress(1));
    expect(onComm).toHaveBeenCalledTimes(1);
    expect(root).toHaveAttribute("data-intro", "done");
    expect(api.state).toBe("done");
  });

  it("REPLAY restarts the same show, playing again, and only one timeline exists", async () => {
    situation("desktop");
    const { root } = await mount();
    const tl = timelines()[0] as gsap.core.Timeline;
    tl.pause();
    act(() => void tl.progress(1));
    expect(root).toHaveAttribute("data-intro", "done");
    act(() => api.replay());
    expect(root).toHaveAttribute("data-intro", "playing");
    expect(tl.time()).toBeLessThan(0.5);
    for (let i = 0; i < 5; i++) act(() => api.replay());
    expect(timelines()).toHaveLength(1);
    expect(loadRig).toHaveBeenCalledTimes(1);
  });

  it("reduced motion: the end state at once, the rig never loaded, no timeline", async () => {
    situation("reduce");
    const { root } = await mount();
    expect(loadRig).not.toHaveBeenCalled();
    expect(root).not.toHaveAttribute("data-rig");
    expect(root).toHaveAttribute("data-intro", "done");
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
    expect(root).not.toHaveAttribute("data-rig");
    expect(root).toHaveAttribute("data-intro", "playing");
    expect(timelines()).toHaveLength(1);
    const tl = timelines()[0] as gsap.core.Timeline;
    tl.pause();
    act(() => void tl.progress(1));
    expect(onComm).not.toHaveBeenCalled();
    expect(root).toHaveAttribute("data-intro", "done");
    expect(api.state).toBe("done");
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
    expect(root).toHaveAttribute("data-intro", "done");
    act(() => api.replay());
    expect(root).toHaveAttribute("data-intro", "playing");
    expect(tl.time()).toBeLessThan(0.5);
    for (let i = 0; i < 5; i++) act(() => api.replay());
    expect(timelines()).toHaveLength(1);
  });

  it("resizing from the stage to the phone mid-play builds the column's show and reaches done", async () => {
    situation("desktop");
    const { root } = await mount();
    const stageTl = timelines()[0] as gsap.core.Timeline;
    stageTl.time(1);
    expect(root).toHaveAttribute("data-rig");

    await changeTo("mobile");
    expect(root).not.toHaveAttribute("data-rig");
    expect(root).toHaveAttribute("data-intro", "playing");
    expect(timelines()).toHaveLength(1);
    expect(timelines()[0]).not.toBe(stageTl);
    expect(
      gsap.getTweensOf(document.querySelector('[data-intro-layout="stage"] [data-part="cta"]')!),
    ).toHaveLength(0);
    const tl = timelines()[0] as gsap.core.Timeline;
    tl.pause();
    act(() => void tl.progress(1));
    expect(root).toHaveAttribute("data-intro", "done");

    // and back again
    await changeTo("desktop");
    expect(root).toHaveAttribute("data-intro", "playing");
    expect(timelines()).toHaveLength(1);
    expect(root).toHaveAttribute("data-rig");
  });

  it("leaving the page reverts the show: no tween is left on the unmounted nodes", async () => {
    situation("desktop");
    const { unmount } = await mount();
    expect(timelines()).toHaveLength(1);
    const root = document.querySelector("main#main")!;
    unmount();
    expect(timelines()).toHaveLength(0);
    expect(root).not.toHaveAttribute("data-rig");
  });
});
