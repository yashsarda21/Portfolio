import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const URLS = ["/a.webp", "/b.webp", "/c.webp"];

/** A browser where the page is loaded and idle callbacks run at once. */
function setup(opts: { wide?: boolean; reduced?: boolean; saveData?: boolean } = {}) {
  const { wide = true, reduced = false, saveData = false } = opts;
  const made: HTMLImageElement[] = [];
  vi.stubGlobal(
    "Image",
    class {
      src = "";
      constructor() {
        made.push(this as unknown as HTMLImageElement);
      }
    },
  );
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q.includes("reduce") ? reduced : q.includes("min-width: 768px") ? wide : false,
  }));
  vi.stubGlobal("requestIdleCallback", (cb: () => void) => cb());
  Object.defineProperty(navigator, "connection", { value: { saveData }, configurable: true });
  Object.defineProperty(document, "readyState", { value: "complete", configurable: true });
  return made;
}

async function load() {
  vi.resetModules();
  return (await import("./prefetchRig")).prefetchRig;
}

beforeEach(() => vi.useRealTimers());
afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "connection");
  Reflect.deleteProperty(document, "readyState");
});

describe("prefetchRig", () => {
  it("creates one Image per URL, nothing appended", async () => {
    const made = setup();
    const before = document.body.innerHTML;
    (await load())(URLS);
    expect(made.map((i) => i.src)).toEqual(URLS);
    expect(document.body.innerHTML).toBe(before);
  });

  it("does nothing below the tablet width (phones)", async () => {
    const made = setup({ wide: false });
    (await load())(URLS);
    expect(made).toHaveLength(0);
  });

  it("does nothing under reduced motion", async () => {
    const made = setup({ reduced: true });
    (await load())(URLS);
    expect(made).toHaveLength(0);
  });

  it("does nothing when the visitor asked to save data", async () => {
    const made = setup({ saveData: true });
    (await load())(URLS);
    expect(made).toHaveLength(0);
  });

  it("asks only once across calls", async () => {
    const made = setup();
    const prefetchRig = await load();
    prefetchRig(URLS);
    prefetchRig(URLS);
    expect(made).toHaveLength(3);
  });

  it("waits for the page load, then for idle", async () => {
    const made = setup();
    Object.defineProperty(document, "readyState", { value: "loading", configurable: true });
    const prefetchRig = await load();
    prefetchRig(URLS);
    expect(made).toHaveLength(0);
    window.dispatchEvent(new Event("load"));
    expect(made).toHaveLength(3);
  });
});
