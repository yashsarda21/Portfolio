import { describe, expect, it, vi } from "vitest";
import { loadOnce } from "./loadOnce";

describe("loadOnce", () => {
  it("starts once and gives every caller the same promise; progress goes to the latest caller", async () => {
    let report: (f: number) => void = () => {};
    let done: (v: string) => void = () => {};
    const start = vi.fn((onProgress: (f: number) => void) => {
      report = onProgress;
      return new Promise<string>((resolve) => (done = resolve));
    });
    const load = loadOnce(start);
    const a = vi.fn();
    const b = vi.fn();
    const first = load(a);
    const second = load(b);
    expect(start).toHaveBeenCalledTimes(1);
    report(0.5);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledWith(0.5);
    done("files");
    await expect(first).resolves.toBe("files");
    await expect(second).resolves.toBe("files");
  });
  it("forgets a failed download, so the next call tries again", async () => {
    const start = vi
      .fn<(onProgress: (f: number) => void) => Promise<string>>()
      .mockRejectedValueOnce(new Error("404"))
      .mockResolvedValueOnce("files");
    const load = loadOnce(start);
    await expect(load(() => {})).rejects.toThrow("404");
    await expect(load(() => {})).resolves.toBe("files");
    expect(start).toHaveBeenCalledTimes(2);
  });
});
