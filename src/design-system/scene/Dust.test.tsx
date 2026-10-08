import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MEDIA } from "@/lib/breakpoints";
import { Dust } from "./Dust";

const REGION = [
  [
    [0.1, 0.1],
    [0.4, 0.1],
    [0.4, 0.9],
    [0.1, 0.9],
  ],
] as const;

/** matchMedia where each query answers from `answers` (default false). */
function mockMedia(answers: Record<string, boolean>) {
  const listeners = new Map<string, Set<() => void>>();
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    get matches() {
      return answers[query] ?? false;
    },
    addEventListener: (_: string, fn: () => void) => {
      if (!listeners.has(query)) listeners.set(query, new Set());
      listeners.get(query)!.add(fn);
    },
    removeEventListener: (_: string, fn: () => void) => listeners.get(query)?.delete(fn),
  }));
  return {
    set(query: string, value: boolean) {
      answers[query] = value;
      listeners.get(query)?.forEach((fn) => fn());
    },
    count: () => [...listeners.values()].reduce((n, s) => n + s.size, 0),
  };
}

const REDUCE = "(prefers-reduced-motion: reduce)";
const LG = MEDIA.lg;

describe("Dust", () => {
  let raf: ReturnType<typeof vi.fn>;
  let caf: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    raf = vi.fn(() => 7);
    caf = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);
    vi.stubGlobal("cancelAnimationFrame", caf);
    const ctx = { clearRect: vi.fn(), fillRect: vi.fn(), fillStyle: "", globalAlpha: 1 };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("is one decorative canvas", () => {
    mockMedia({ [REDUCE]: true });
    const { container } = render(<Dust regions={REGION} />);
    const canvas = container.firstElementChild as HTMLCanvasElement;
    expect(canvas.tagName).toBe("CANVAS");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll("canvas")).toHaveLength(1);
  });

  it("under reduced motion it never starts: no animation frame is requested", () => {
    mockMedia({ [REDUCE]: true, [LG]: true });
    render(<Dust regions={REGION} />);
    expect(raf).not.toHaveBeenCalled();
  });

  it("below lg it never starts", () => {
    mockMedia({ [REDUCE]: false, [LG]: false });
    render(<Dust regions={REGION} />);
    expect(raf).not.toHaveBeenCalled();
  });

  it("on a wide screen with motion allowed it animates, and unmount cancels the frame", () => {
    const media = mockMedia({ [REDUCE]: false, [LG]: true });
    const { unmount } = render(<Dust regions={REGION} />);
    expect(raf).toHaveBeenCalled();
    expect(media.count()).toBeGreaterThan(0);
    unmount();
    expect(caf).toHaveBeenCalledWith(7);
    expect(media.count()).toBe(0);
  });

  it("stops when the tab is hidden and resumes when it is shown again", () => {
    mockMedia({ [REDUCE]: false, [LG]: true });
    render(<Dust regions={REGION} />);
    const before = raf.mock.calls.length;
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(caf).toHaveBeenCalled();
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(raf.mock.calls.length).toBeGreaterThan(before);
  });

  it("starts and stops when the conditions change", () => {
    const media = mockMedia({ [REDUCE]: false, [LG]: false });
    render(<Dust regions={REGION} />);
    expect(raf).not.toHaveBeenCalled();
    media.set(LG, true);
    expect(raf).toHaveBeenCalled();
    caf.mockClear();
    media.set(REDUCE, true);
    expect(caf).toHaveBeenCalled();
  });
});
