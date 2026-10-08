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

  it("lets the sized recipes of one face replace each other (the face is shared in base.css, the class is not)", () => {
    expect(cn("type-btn-heavy", "type-btn-2xl")).toBe("type-btn-2xl");
    expect(cn("type-btn-bar-lg", "type-btn-lg")).toBe("type-btn-lg");
    expect(cn("type-hero", "type-hero-sm")).toBe("type-hero-sm");
    expect(cn("type-score-lg", "type-score-md")).toBe("type-score-md");
    expect(cn("type-sub", "type-sub-lg")).toBe("type-sub-lg");
    expect(cn("type-d2", "type-welcome")).toBe("type-welcome");
    expect(cn("font-mono tracking-wide", "type-btn-2xl")).toBe("type-btn-2xl");
  });

  it("knows the glow and blur tokens: one shadow, one blur", () => {
    expect(cn("shadow-glow-volt-sm", "shadow-glow-volt-lg")).toBe("shadow-glow-volt-lg");
    expect(cn("blur-beam", "blur-soft")).toBe("blur-soft");
    expect(cn("shadow-glow-volt-md", "shadow-volt-a35")).toBe(
      "shadow-glow-volt-md shadow-volt-a35",
    );
  });
});
