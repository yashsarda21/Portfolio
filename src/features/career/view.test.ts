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

  it("rows: one per innings, with the artboard's columns", () => {
    const { rows, defaultId } = build();
    expect(rows.map((r) => r.id)).toEqual(["01", "02"]);
    expect(defaultId).toBe("01");
    expect(rows[0]).toMatchObject({
      n: "01",
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

  it("rows: detail has the heading, role line, every ball and the stack", () => {
    const [now, intern] = build().rows;
    expect(now!.detail).toEqual({
      heading: "INNINGS 01 · BALL BY BALL",
      span: "Jul 2024 – now",
      roleLine: "Software Engineer 1 · Pune, MH",
      balls: first.ballByBall,
      shotsLabel: "SHOTS PLAYED",
      stack: first.stack,
    });
    expect(now!.detail.balls).toHaveLength(4);
    expect(intern!.detail.heading).toBe("INNINGS 02 · BALL BY BALL");
    expect(intern!.detail.balls).toHaveLength(3);
  });

  it("academy: the next innings, linking to the trophy room's academy", () => {
    expect(build().academy).toEqual({
      n: "03",
      team: "PICT, Pune",
      role: "B.Tech IT",
      span: "2020 – 2024",
      status: "ACADEMY",
      to: "/trophies#academy",
    });
  });

  it("academy: the role is the short degree, so the row stays on one line", () => {
    const { academy } = build();
    expect(academy!.role).toBe(content.trainingAcademy.degreeShort);
    expect(academy!.role).not.toBe(content.trainingAcademy.degree);
  });

  it("academy: the status label comes from the interface copy", () => {
    const renamed = {
      ...ui,
      pages: { ...ui.pages, career: { ...ui.pages.career, academy: "SCHOOL" } },
    } as unknown as UiCopy;
    expect(buildCareerView(content, renamed, ROUTES).academy!.status).toBe("SCHOOL");
  });

  it("academy: numbered after the last career row", () => {
    const extra: Content = {
      ...content,
      careerStats: [
        ...content.careerStats,
        { ...first, innings: "03", status: "DEBUT", start: "2022-01", end: "2022-02" },
      ],
    };
    const view = build(extra);
    expect(view.rows).toHaveLength(3);
    expect(view.academy!.n).toBe("04");
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
