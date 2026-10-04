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

  it("treats glass surfaces as one conflict group", () => {
    expect(cn("glass-solid", "glass")).toBe("glass");
    expect(cn("bar", "glass-solid")).toBe("glass-solid");
  });

  it("keeps glass alongside border and background utilities", () => {
    expect(cn("glass", "border-volt bg-panel")).toBe("glass border-volt bg-panel");
  });

  it("keeps a type recipe alongside font-mono (CSS order makes font-mono win)", () => {
    expect(cn("type-d1", "font-mono")).toBe("type-d1 font-mono");
  });

  it("treats leading-auto as a line-height, so a later one replaces an earlier one", () => {
    expect(cn("leading-3", "leading-auto")).toBe("leading-auto");
    expect(cn("leading-auto", "leading-3")).toBe("leading-3");
  });

  it("keeps leading-auto after a type recipe, but a later recipe replaces it", () => {
    expect(cn("type-body", "leading-auto")).toBe("type-body leading-auto");
    expect(cn("leading-auto", "type-body")).toBe("type-body");
  });
});
