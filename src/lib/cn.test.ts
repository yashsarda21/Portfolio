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
});
