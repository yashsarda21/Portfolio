import { afterEach, describe, expect, it, vi } from "vitest";
import { safeStorage } from "./storage";

describe("safeStorage", () => {
  afterEach(() => vi.restoreAllMocks());

  it("round-trips values", () => {
    safeStorage.set("arena:test", "1");
    expect(safeStorage.get("arena:test")).toBe("1");
    safeStorage.remove("arena:test");
    expect(safeStorage.get("arena:test")).toBeNull();
  });

  it("never throws when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => safeStorage.set("k", "v")).not.toThrow();
    expect(safeStorage.get("k")).toBeNull();
  });
});
