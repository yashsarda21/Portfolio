import { describe, expect, it } from "vitest";
import { ui } from "@/content";
import { pageMeta } from "./meta";

const find = (tags: ReturnType<typeof pageMeta>, key: string, value: string) =>
  tags.find((t) => (t as Record<string, unknown>)[key] === value) as
    Record<string, unknown> | undefined;

describe("pageMeta", () => {
  it("returns the title, description and share tags for a route", () => {
    const r = ui.routes.scout;
    const tags = pageMeta("scout");
    expect(tags).toContainEqual({ title: r.title });
    expect(find(tags, "name", "description")?.content).toBe(r.description);
    expect(find(tags, "property", "og:title")?.content).toBe(r.title);
    expect(find(tags, "property", "og:description")?.content).toBe(r.description);
    expect(find(tags, "property", "og:type")?.content).toBe("website");
    expect(find(tags, "property", "og:site_name")?.content).toBe(ui.brand.siteName);
    expect(find(tags, "name", "twitter:card")?.content).toBe("summary");
  });

  it("uses the given og:type", () => {
    expect(find(pageMeta("scout", { type: "profile" }), "property", "og:type")?.content).toBe(
      "profile",
    );
  });

  it("adds a JSON-LD script only when given one", () => {
    const jsonLd = { "@type": "Person", name: "Yash Sarda" };
    expect(pageMeta("scout").some((t) => "script:ld+json" in t)).toBe(false);
    expect(pageMeta("scout", { jsonLd })).toContainEqual({ "script:ld+json": jsonLd });
  });
});
