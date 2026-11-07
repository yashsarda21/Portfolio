import { describe, expect, it } from "vitest";
import { content, ui, type Content } from "@/content";
import { ROUTES } from "@/shell/routes";
import { buildScoutReport } from "./report";

const build = (c: Content = content) => buildScoutReport(c, ui, ROUTES);
const withPdf = (): Content => ({
  ...content,
  player: { ...content.player, resumePdf: "/yash-sarda-public.pdf" },
});

function collectHrefs(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => collectHrefs(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (k === "href" && typeof v === "string") out.push(v);
      else collectHrefs(v, out);
    }
  }
  return out;
}

describe("buildScoutReport", () => {
  it("hero chips and name", () => {
    const { hero } = build();
    expect(hero.nameParts).toEqual(["Yash", "Sarda"]);
    expect(hero.chips).toEqual([
      { label: "Pune, India" },
      { label: "Software Engineer 1 · SINCE JUL 2024", short: "SE1 · SINCE JUL 2024" },
      { label: "B.Tech IT · PICT · CGPA 8.94", desktopOnly: true },
      { label: "750+ PROBLEMS SOLVED", short: "750+ SOLVED", highlight: true },
    ]);
  });

  it("career rows", () => {
    const { career } = build();
    expect(career.metaShort).toBe("2 INNINGS");
    const [now, intern] = career.rows;
    expect(now).toMatchObject({
      span: "Jul 2024 – now",
      status: "NOT OUT",
      isCurrent: true,
      roleLine: "Software Engineer 1 · Pune",
      stackLine: content.careerStats[0]!.stack.join(" · "),
      bullets: content.careerStats[0]!.ballByBall,
      compactTitle: "Deutsche Bank",
      compactLine: "Software Engineer 1 · submissions 98% faster: minutes to under 2 s",
    });
    expect(intern!.compactTitle).toBe("Deutsche Bank · Intern");
    expect(intern!.compactLine).toBeUndefined();
  });

  it("highlights go strongest first, only the first is featured", () => {
    const { highlights } = build();
    expect(highlights.items.map((i) => i.round)).toEqual([
      "THE FINAL",
      "SEMI-FINAL",
      "QUARTER-FINAL",
    ]);
    expect(highlights.items.map((i) => i.featured)).toEqual([true, false, false]);
    expect(highlights.items[0]!.body).toBe(content.matchHighlights[0]!.scoutLine);
    expect(highlights.more.href).toBe(content.player.contact.github);
  });

  it("attributes: four groups, craft & tools last and unfilled", () => {
    const { attributes } = build();
    expect(attributes.groups).toHaveLength(4);
    const last = attributes.groups[3]!;
    expect(last.name).toBe("CRAFT & TOOLS");
    expect(last.chips.map((c) => c.label)).toEqual(content.scout.craftAndTools);
    expect(last.chips.every((c) => !c.filled)).toBe(true);
    expect(attributes.groups[0]!.chips).toEqual([
      { label: "Java", filled: true },
      { label: "Spring Boot", filled: true },
      { label: "Spring Security", filled: true },
      { label: "REST APIs", filled: true },
      { label: "Apache Kafka", filled: false },
    ]);
  });

  it("trophies list Yash's five", () => {
    const { trophies } = build();
    expect(trophies.rows).toHaveLength(5);
    expect(trophies.rows[0]).toEqual({
      title: "750+ Problems Solved",
      sub: "LeetCode · Codeforces · CodeChef",
    });
  });

  it("academy lines", () => {
    const { academy } = build();
    expect(academy.degreeLine).toBe("B.Tech, Information Technology · Distinction, SPPU");
    expect(academy.datesLine).toBe("Jul 2020 – Jun 2024 · CGPA 8.94");
  });

  it("team up links (no resume file)", () => {
    const { teamUp } = build();
    expect(teamUp.links.map((l) => l.label)).toEqual([
      "yashsarda2002@gmail.com",
      "LinkedIn · yash-sarda2107",
      "GitHub · yashsarda21",
      "Request resume",
    ]);
  });

  it("resume null: request by email, no .pdf anywhere", () => {
    const report = build();
    expect(report.hero.primary.label).toBe("REQUEST RESUME");
    expect(report.hero.primary.href.startsWith("mailto:")).toBe(true);
    const hrefs = collectHrefs(report);
    expect(hrefs.length).toBeGreaterThan(5);
    expect(hrefs.some((h) => h.endsWith(".pdf"))).toBe(false);
  });

  it("resume set: view in a new tab and download row", () => {
    const report = build(withPdf());
    expect(report.hero.primary).toMatchObject({
      label: "VIEW PLAYER CARD (PDF)",
      href: "/yash-sarda-public.pdf",
      newTab: true,
    });
    expect(report.hero.newTabHint).toBe(ui.a11y.newTab);
    expect(report.teamUp.links.at(-1)).toMatchObject({
      label: "Resume (PDF)",
      glyph: "↓",
      download: ui.scout.resume.fileName,
    });
    expect(ui.scout.resume.fileName).toBe("Yash-Sarda-Resume.pdf");
  });

  it("links with no trailing mark have no glyph key at all", () => {
    const { hero } = build();
    expect("glyph" in hero.primary).toBe(false);
    expect(build(withPdf()).hero.primary).not.toHaveProperty("glyph");
  });

  it("career compact titles read the short role from the row, not by index", () => {
    const { career } = build();
    expect(career.rows[1]!.compactTitle).toBe(
      `Deutsche Bank · ${content.careerStats[1]!.shortRole}`,
    );
  });

  it("throws if content has no AI & Craft attribute group", () => {
    const renamed: Content = {
      ...content,
      playerAttributes: {
        ...content.playerAttributes,
        groups: content.playerAttributes.groups.map((g) =>
          g.name === "AI & Craft" ? { ...g, name: "Skills" } : g,
        ),
      },
    };
    expect(() => build(renamed)).toThrow(/AI & Craft/);
  });

  it("routes and anchors", () => {
    const report = build();
    expect(report.header.enter.to).toBe(ROUTES.arena);
    expect(report.actions.card.to).toBe(ROUTES.card);
    expect(report.actions.teamUp.href).toBe("#teamup");
    expect(report.header.nav.map((n) => n.id)).toEqual([
      "career",
      "highlights",
      "attributes",
      "trophies",
      "teamup",
    ]);
  });
});
