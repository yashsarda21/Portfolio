import { describe, expect, it } from "vitest";
import raw from "./content.json";
import { parseContent } from "./schema";
import {
  getAttributeGroups,
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
    });
    expect(rows[1]).toMatchObject({
      innings: "02",
      status: "DEBUT",
      span: "Jun – Jul 2023",
      isCurrent: false,
    });
  });

  it("innings reveals add the academy as innings 03", () => {
    const reveals = getInningsReveals(c);
    expect(reveals.map((r) => r.status)).toEqual(["NOT OUT", "DEBUT", "ACADEMY"]);
    expect(reveals[2]).toEqual({
      n: "03",
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

  it("trophies mark only the hidden one as locked", () => {
    const trophies = getTrophies(c);
    expect(trophies).toHaveLength(6);
    expect(trophies.filter((t) => t.locked).map((t) => t.title)).toEqual(["Giant Killer"]);
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
});
