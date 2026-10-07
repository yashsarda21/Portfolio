import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadRig } from "./rig";

/** A stand-in for Image: records the src and decodes as the test script says. */
let created: FakeImage[] = [];
let decodeFor: (src: string) => Promise<void>;

class FakeImage {
  src = "";
  constructor() {
    created.push(this);
  }
  decode() {
    return decodeFor(this.src);
  }
}

beforeEach(() => {
  created = [];
  decodeFor = () => Promise.resolve();
  vi.stubGlobal("Image", FakeImage);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const URLS = ["/a.webp", "/b.webp", "/c.webp"];

describe("loadRig", () => {
  it("is ready when every strip decodes, asking for each once", async () => {
    await expect(loadRig(URLS, { timeoutMs: 1000 })).resolves.toBe("ready");
    expect(created.map((i) => i.src)).toEqual(URLS);
  });

  it("is ready for no strips at all", async () => {
    await expect(loadRig([], { timeoutMs: 1000 })).resolves.toBe("ready");
  });

  it("is an error when any strip fails to decode", async () => {
    decodeFor = (src) => (src === "/b.webp" ? Promise.reject(new Error("404")) : Promise.resolve());
    await expect(loadRig(URLS, { timeoutMs: 1000 })).resolves.toBe("error");
  });

  it("is an error when decode() is not available", async () => {
    vi.stubGlobal(
      "Image",
      class {
        src = "";
      },
    );
    await expect(loadRig(URLS, { timeoutMs: 1000 })).resolves.toBe("error");
  });

  it("is an error when there is no Image at all (prerender)", async () => {
    vi.stubGlobal("Image", undefined);
    await expect(loadRig(URLS, { timeoutMs: 1000 })).resolves.toBe("error");
  });

  it("times out when a strip never decodes, and does not hang", async () => {
    vi.useFakeTimers();
    decodeFor = () => new Promise<void>(() => {});
    const done = vi.fn();
    void loadRig(URLS, { timeoutMs: 1500 }).then(done);
    await vi.advanceTimersByTimeAsync(1499);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalledWith("timeout");
  });

  it("keeps its first answer when a strip decodes after the timeout", async () => {
    vi.useFakeTimers();
    let finish: () => void = () => {};
    decodeFor = () => new Promise<void>((r) => (finish = r));
    const result = loadRig(["/a.webp"], { timeoutMs: 100 });
    await vi.advanceTimersByTimeAsync(100);
    finish();
    await expect(result).resolves.toBe("timeout");
  });

  it("clears its timer once the strips are in", async () => {
    vi.useFakeTimers();
    await loadRig(URLS, { timeoutMs: 1500 });
    expect(vi.getTimerCount()).toBe(0);
  });
});
