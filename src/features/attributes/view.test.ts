import { describe, expect, it } from "vitest";
import { content, ui, type Content } from "@/content";
import { buildAttributesView } from "./view";

const SRC = "/assets/portrait.webp";
const build = (c: Content = content) => buildAttributesView(c, ui, SRC);

/** The same content with a fifth group and a sixth kit-bag entry: nothing may assume a fixed count. */
const extended = (): Content => {
  const extra = {
    name: "Ops",
    shot: "Serve",
    note: "Getting it live.",
    skills: [["Docker", "kit"]],
  };
  return {
    ...content,
    playerAttributes: {
      ...content.playerAttributes,
      groups: [...content.playerAttributes.groups, extra],
      kitBag: [...content.playerAttributes.kitBag, "Docker"],
    },
  } as Content;
};

describe("buildAttributesView", () => {
  it("legend: shipped, built, kit with volt, floodlight, dim", () => {
    expect(build().legend).toEqual([
      { label: "SHIPPED AT DEUTSCHE BANK", swatch: "volt" },
      { label: "BUILT IN PROJECTS", swatch: "floodlight" },
      { label: "IN THE KIT BAG", swatch: "dim" },
    ]);
  });

  describe("profile", () => {
    it("badge is the position and its label", () => {
      expect(build().profile.badge).toEqual({ value: "SE", label: "POSITION" });
    });

    it("the portrait is the passed image with the player's name as its alt", () => {
      expect(build().profile.portrait).toEqual({ src: SRC, alt: "Yash Sarda" });
    });

    it("name and role line: the current role and club", () => {
      const { profile } = build();
      expect(profile.name).toBe("Yash Sarda");
      expect(profile.roleLine).toBe("Software Engineer 1 · Deutsche Bank");
    });

    it("with no current role the role line falls back to the player's title", () => {
      const ended: Content = {
        ...content,
        careerStats: content.careerStats.map((row) => ({ ...row, end: "2025-01" })),
      };
      expect(build(ended).profile.roleLine).toBe("Software Engineer · Deutsche Bank");
    });

    it("rows: playing style, then languages joined with a dot", () => {
      expect(build().profile.rows).toEqual([
        { k: "Playing style", v: "Full-stack" },
        { k: "Languages", v: "Java · JavaScript · Python" },
      ]);
    });

    it("kit bag items are joined in content order", () => {
      expect(build().profile.kitBag).toEqual({
        label: "Kit bag",
        items: "Git · Google Cloud · CI/CD · Postman · Cursor · Gen AI · TeamCity · uDeploy",
      });
    });
  });

  describe("groups", () => {
    it("come in content order: Backend, Frontend, Data, Craft", () => {
      expect(build().groups.map((g) => g.name)).toEqual(["Backend", "Frontend", "Data", "Craft"]);
    });

    it("shot line is SHOT, a dot and the shot (the case is the page's)", () => {
      expect(build().groups.map((g) => g.shotLine)).toEqual([
        "SHOT · Smash",
        "SHOT · Drop shot",
        "SHOT · Defence",
        "SHOT · Court vision",
      ]);
    });

    it("note and skills carry through; the tag replaces the level word", () => {
      const backend = build().groups[0]!;
      expect(backend.note).toBe("Power and pace — where most of my points are won.");
      expect(backend.skills).toEqual([
        { name: "Java", level: "shipped", tierLabel: "SHIPPED" },
        { name: "Spring Boot", level: "shipped", tierLabel: "SHIPPED" },
        { name: "JUnit", level: "shipped", tierLabel: "75+ TESTS" },
        { name: "Apache Kafka", level: "kit", tierLabel: "KIT BAG" },
      ]);
    });

    it("has 16 skills in all", () => {
      expect(build().groups.flatMap((g) => g.skills)).toHaveLength(16);
    });
  });

  it("a fifth group and a longer kit bag are shown, not dropped", () => {
    const view = build(extended());
    expect(view.groups).toHaveLength(5);
    expect(view.groups[4]).toMatchObject({ name: "Ops", shotLine: "SHOT · Serve" });
    expect(view.profile.kitBag.items.endsWith(" · Docker")).toBe(true);
  });
});
