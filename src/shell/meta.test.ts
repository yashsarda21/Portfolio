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

  describe("with a production address", () => {
    const base = "https://a.example";
    const tags = pageMeta("cricket", {}, base);

    it("adds the canonical link, og:url and the share image", () => {
      expect(tags).toContainEqual({
        tagName: "link",
        rel: "canonical",
        href: "https://a.example/arena/cricket",
      });
      expect(find(tags, "property", "og:url")?.content).toBe("https://a.example/arena/cricket");
      expect(find(tags, "property", "og:image")?.content).toBe("https://a.example/og.png");
      expect(find(tags, "property", "og:image:width")?.content).toBe("1200");
      expect(find(tags, "property", "og:image:height")?.content).toBe("630");
      expect(find(tags, "property", "og:image:alt")?.content).toBe(
        "Yash Sarda, Software Engineer — The Arena",
      );
      expect(find(tags, "name", "twitter:card")?.content).toBe("summary_large_image");
    });

    it("gives the home page the bare address", () => {
      expect(find(pageMeta("home", {}, base), "property", "og:url")?.content).toBe(
        "https://a.example/",
      );
    });
  });

  it("without an address there is no canonical, og:url or og:image", () => {
    const tags = pageMeta("cricket", {}, null);
    expect(tags.some((t) => "tagName" in t || "href" in t)).toBe(false);
    expect(find(tags, "property", "og:url")).toBeUndefined();
    expect(find(tags, "property", "og:image")).toBeUndefined();
    expect(find(tags, "name", "twitter:card")?.content).toBe("summary");
  });

  it("noindex adds the robots tag, and names no canonical address", () => {
    const tags = pageMeta("notFound", { noindex: true }, "https://a.example");
    expect(find(tags, "name", "robots")?.content).toBe("noindex");
    expect(find(tags, "property", "og:url")).toBeUndefined();
    expect(pageMeta("cricket", {}, null).some((t) => t.name === "robots")).toBe(false);
  });
});
