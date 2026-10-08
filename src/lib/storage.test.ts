import { afterEach, describe, expect, it, vi } from "vitest";
import { safeJSONStorage, safeStorage } from "./storage";

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

describe("safeJSONStorage", () => {
  afterEach(() => localStorage.removeItem("arena:test"));

  it("returns valid JSON text as is", () => {
    safeJSONStorage.setItem("arena:test", '{"a":1}');
    expect(safeJSONStorage.getItem("arena:test")).toBe('{"a":1}');
  });

  it("reads malformed text as nothing saved and removes it", () => {
    localStorage.setItem("arena:test", "{not json");
    expect(safeJSONStorage.getItem("arena:test")).toBeNull();
    expect(localStorage.getItem("arena:test")).toBeNull();
  });

  it("reads missing or blocked storage as nothing saved", () => {
    expect(safeJSONStorage.getItem("arena:test")).toBeNull();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(safeJSONStorage.getItem("arena:test")).toBeNull();
    vi.restoreAllMocks();
  });
});
