import { describe, expect, it } from "vitest";
import { content, ui, type Content, type UiCopy } from "@/content";
import { ROUTES } from "@/shell/routes";
import { buildCareerView } from "./view";

const build = (c: Content = content) => buildCareerView(c, ui, ROUTES);
const first = content.careerStats[0]!;

describe("buildCareerView", () => {
  it("stats: pro since, club and the current innings", () => {
    const { stats } = build();
    expect(stats).toHaveLength(3);
    expect(stats[0]).toMatchObject({ label: "PRO SINCE", value: "Jul 2024" });
    expect(stats[0]!.tone).toBe("glass");
    expect(stats[1]).toMatchObject({ label: "CLUB", value: "Deutsche", tone: "glass" });
    expect(stats[2]).toEqual({ label: "CURRENT", value: "NOT OUT", tone: "volt" });
  });

  it("carries the column headers, list label, legend and player-card link", () => {
    const view = build();
    expect(view.cols).toEqual({
      inn: "INN",
      team: "TEAM",
      role: "ROLE",
      span: "SPAN",
      status: "STATUS",
    });
    expect(view.listLabel).toBe(ui.pages.career.listLabel);
    expect(view.legend).toBe(ui.pages.career.legend);
    expect(view.viewCard).toEqual({ label: ui.pages.career.viewCard, to: "/card" });
  });

  it("rows: told from the start, the academy, then the internship, then the current role", () => {
    const { rows, defaultId } = build();
    expect(rows.map((r) => r.id)).toEqual(["01", "02", "03"]);
    expect(defaultId).toBe("03");
    expect(rows[2]).toMatchObject({
      n: "03",
      team: "Deutsche Bank",
      role: "Software Engineer 1",
      span: "Jul 2024 – now",
      status: "NOT OUT",
      current: true,
    });
    expect(rows[1]).toMatchObject({
      n: "02",
      role: "Graduate Analyst Intern",
      span: "Jun – Jul 2023",
      status: "DEBUT",
      current: false,
    });
  });

  it("rows: detail has the heading, title, role line, every ball and the stack", () => {
    const [, intern, now] = build().rows;
    expect(now!.detail).toEqual({
      heading: "INNINGS 03 · BALL BY BALL",
      span: "Jul 2024 – now",
      title: "Deutsche Bank",
      roleLine: "Software Engineer 1 · Pune, MH",
      balls: first.ballByBall,
      footer: { kind: "shots", label: "SHOTS PLAYED", stack: first.stack },
    });
    expect(now!.detail.balls).toHaveLength(4);
    expect(intern!.detail.heading).toBe("INNINGS 02 · BALL BY BALL");
    expect(intern!.detail.balls).toHaveLength(3);
  });

  it("academy: row 01, drawn like the innings rows", () => {
    expect(build().rows[0]).toMatchObject({
      id: "01",
      n: "01",
      team: "PICT, Pune",
      // The short degree keeps the row to one line; the panel shows the full one.
      role: "B.Tech IT",
      span: "2020 – 2024",
      status: "ACADEMY",
      current: false,
    });
    expect(build().rows[0]!.role).not.toBe(content.trainingAcademy.degree);
  });

  it("academy: the panel names the school and links to the trophy room", () => {
    const { detail } = build().rows[0]!;
    expect(detail).toEqual({
      heading: "INNINGS 01 · ACADEMY",
      span: "Jul 2020 – Jun 2024",
      title: "Pune Institute of Computer Technology (PICT)",
      roleLine: "B.Tech, Information Technology · Distinction, SPPU",
      balls: [
        "CGPA 8.94",
        "CGPA 8.94 with Distinction, Savitribai Phule Pune University",
        "Published paper: AI-Enhanced Interview Grooming Platform",
        "MHT-CET 99.5 percentile, State Merit Rank 709",
        "PCSB (PICT CSI Student Branch) member: organised college technical events",
      ],
      footer: { kind: "link", label: "SEE IT IN THE TROPHY ROOM", to: "/trophies#academy" },
    });
    expect(detail.balls).toEqual(expect.arrayContaining([...content.trainingAcademy.extras]));
  });

  it("academy: the status and link labels come from the interface copy", () => {
    const renamed = {
      ...ui,
      pages: {
        ...ui.pages,
        career: { ...ui.pages.career, academy: "SCHOOL", academyLink: "GO THERE" },
      },
    } as unknown as UiCopy;
    const row = buildCareerView(content, renamed, ROUTES).rows[0]!;
    expect(row.status).toBe("SCHOOL");
    expect(row.detail.heading).toBe("INNINGS 01 · SCHOOL");
    expect(row.detail.footer).toMatchObject({ kind: "link", label: "GO THERE" });
  });

  it("a third role goes between the academy and the current role, by start date", () => {
    const extra: Content = {
      ...content,
      careerStats: [
        ...content.careerStats,
        { ...first, innings: "03", status: "DEBUT", start: "2022-01", end: "2022-02" },
      ],
    };
    const { rows } = build(extra);
    expect(rows.map((r) => r.id)).toEqual(["01", "02", "03", "04"]);
    expect(rows.map((r) => r.status)).toEqual(["ACADEMY", "DEBUT", "DEBUT", "NOT OUT"]);
    expect(rows[0]!.detail.heading).toBe("INNINGS 01 · ACADEMY");
    expect(rows[3]!.current).toBe(true);
  });

  it("current tile: follows the row with no end date", () => {
    const moved: Content = {
      ...content,
      careerStats: [
        { ...first, end: "2025-03" },
        { ...content.careerStats[1]!, end: null, status: "DEBUT" },
      ],
    };
    const [, , current] = build(moved).stats;
    expect(current).toEqual({ label: "CURRENT", value: "DEBUT", tone: "volt" });
  });

  it("current tile: falls back to a plain tile when nobody is current", () => {
    const over: Content = {
      ...content,
      careerStats: content.careerStats.map((row) => ({ ...row, end: row.end ?? "2025-01" })),
    };
    expect(build(over).stats[2]!.tone).toBe("glass");
  });
});
