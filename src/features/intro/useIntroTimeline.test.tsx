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

/** matchMedia that answers for one situation: which of the three tier queries is true. */
function situation(active: keyof typeof QUERY) {
  window.matchMedia = ((query: string) => ({
    matches: query === QUERY[active],
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia;
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
  });

  it("phone width (no phone intro yet): nothing plays, nothing loads, the root is done", async () => {
    situation("mobile");
    const { root } = await mount();
    expect(loadRig).not.toHaveBeenCalled();
    expect(timelines()).toHaveLength(0);
    expect(root).not.toHaveAttribute("data-rig");
    expect(root).toHaveAttribute("data-intro", "done");
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
