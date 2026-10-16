import { describe, expect, it } from "vitest";
import raw from "./content.json";
import { parseContent } from "./schema";
import {
  getAcademy,
  getAttributeGroups,
  getCardStat,
  getCareerRows,
  getHighlights,
  getInningsReveals,
  getPlayerFirstName,
  getResumeAction,
  getTrophies,
} from "./selectors";

const c = parseContent(raw);

describe("selectors", () => {
  it("career rows carry formatted spans and current flag", () => {
    const rows = getCareerRows(c);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      innings: "01",
      status: "NOT OUT",
      span: "Jul 2024 – now",
      isCurrent: true,
      shortRole: c.careerStats[0]!.shortRole,
    });
    expect(rows[1]).toMatchObject({
      innings: "02",
      status: "DEBUT",
      span: "Jun – Jul 2023",
      isCurrent: false,
      shortRole: c.careerStats[1]!.shortRole,
    });
    expect(rows[1]!.shortRole).toBe("Intern");
  });

  it("innings reveals tell the career from the start: academy 01, then the roles oldest first", () => {
    const reveals = getInningsReveals(c);
    expect(reveals.map((r) => r.status)).toEqual(["ACADEMY", "DEBUT", "NOT OUT"]);
    expect(reveals.map((r) => r.kind)).toEqual(["academy", "career", "career"]);
    expect(reveals.map((r) => r.n)).toEqual(["01", "02", "03"]);
    expect(reveals[0]).toEqual({
      kind: "academy",
      n: "01",
      status: "ACADEMY",
      team: "PICT, Pune",
      role: "B.Tech, Information Technology",
      span: "2020 – 2024",
    });
  });

  it("highlights come in tournament order QF → SF → FINAL", () => {
    expect(getHighlights(c).map((h) => h.roundShort)).toEqual(["QF", "SF", "F"]);
  });

  it("attribute skills map levels to evidence segments and labels", () => {
    const groups = getAttributeGroups(c);
    expect(groups.map((g) => g.name)).toEqual(["Backend", "Frontend", "Data", "Craft"]);
    const backend = groups[0]!;
    expect(backend.skills[0]).toEqual({
      name: "Java",
      level: "shipped",
      segments: 9,
      tierLabel: "SHIPPED",
    });
    expect(backend.skills[2]).toEqual({
      name: "JUnit",
      level: "shipped",
      segments: 9,
      tierLabel: "75+ TESTS",
    });
    expect(backend.skills[3]).toMatchObject({ level: "kit", segments: 5, tierLabel: "KIT BAG" });
    expect(groups[1]!.skills[2]).toMatchObject({ level: "built", segments: 7, tierLabel: "BUILT" });
  });

  it("returns Yash's five trophies, none of them hidden", () => {
    const trophies = getTrophies(c);
    expect(trophies.map((t) => t.type)).toEqual(["cup", "medal", "plaque", "pennant", "round"]);
    expect(trophies.every((t) => !("locked" in t))).toBe(true);
  });

  it("resume falls back to a request email while no public PDF exists", () => {
    const action = getResumeAction(c);
    expect(action.kind).toBe("request");
    expect(action.href).toMatch(/^mailto:yashsarda2002@gmail\.com\?subject=/);
  });

  it("resume links the public PDF once one is set", () => {
    const withPdf = parseContent({
      ...raw,
      player: { ...raw.player, resumePdf: "/Yash-Sarda-Resume-public.pdf" },
    });
    expect(getResumeAction(withPdf)).toEqual({
      kind: "pdf",
      href: "/Yash-Sarda-Resume-public.pdf",
    });
  });

  it("first name is the first word of the player name", () => {
    expect(getPlayerFirstName(c)).toBe("Yash");
  });

  describe("getAcademy", () => {
    it("drops the trailing short-name suffix and formats the span", () => {
      const a = getAcademy(c);
      expect(a.name).toBe("Pune Institute of Computer Technology");
      expect(a.span).toBe("Jul 2020 – Jun 2024");
      expect(a).toMatchObject({
        shortName: "PICT",
        city: "Pune",
        degree: "B.Tech, Information Technology",
        degreeShort: "B.Tech IT",
        cgpa: "8.94",
        honours: "Distinction, SPPU",
        honoursShort: "Distinction",
      });
      expect(a.extras).toEqual(c.trainingAcademy.extras);
    });

    it("returns a school without a suffix unchanged", () => {
      const plain = {
        ...c,
        trainingAcademy: { ...c.trainingAcademy, school: "Some University" },
      };
      expect(getAcademy(plain).name).toBe("Some University");
    });

    it("a school ending in a different parenthetical is unchanged", () => {
      const other = {
        ...c,
        trainingAcademy: { ...c.trainingAcademy, school: "University of Mumbai (Autonomous)" },
      };
      expect(getAcademy(other).name).toBe("University of Mumbai (Autonomous)");
    });

    it("honoursShort falls back to the full honours when content has none", () => {
      const rest: Partial<typeof c.trainingAcademy> = { ...c.trainingAcademy };
      delete rest.honoursShort;
      const plain = { ...c, trainingAcademy: rest } as typeof c;
      expect(getAcademy(plain).honoursShort).toBe("Distinction, SPPU");
    });
  });

  describe("getCardStat", () => {
    it("finds a stat by its id, whatever the card prints as its label", () => {
      const relabelled = {
        ...c,
        player: {
          ...c.player,
          cardStats: c.player.cardStats.map((s) =>
            s.id === "problems" ? { ...s, label: "SOLVED" } : s,
          ),
        },
      };
      expect(getCardStat(relabelled, "problems")).toMatchObject({ label: "SOLVED", value: "750+" });
    });

    it("throws when the id is missing", () => {
      expect(() => getCardStat(c, "nope")).toThrow(/"nope"/);
    });
  });
});
