import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });

  it("lets the later Tailwind class win on conflict", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("accepts conditional objects", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });

  it("treats type-* recipes as one conflict group", () => {
    expect(cn("type-d1", "type-d2")).toBe("type-d2");
  });

  it("keeps a type recipe alongside a colour", () => {
    expect(cn("type-d1 text-volt")).toBe("type-d1 text-volt");
  });

  it("treats Arena easings as one conflict group", () => {
    expect(cn("ease-follow", "ease-snap")).toBe("ease-snap");
  });

  it("treats Arena shadows as one conflict group", () => {
    expect(cn("shadow-board", "shadow-toast")).toBe("shadow-toast");
  });

  it("keeps an Arena shadow alongside a shadow colour", () => {
    expect(cn("shadow-board", "shadow-volt-a35")).toBe("shadow-board shadow-volt-a35");
  });

  it("lets a later type recipe replace earlier font classes", () => {
    expect(cn("font-mono", "type-d1")).toBe("type-d1");
  });
});
