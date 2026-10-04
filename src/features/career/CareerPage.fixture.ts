// Artboard copy for pixel-parity stories only (Cricket-Career). Real pages use buildCareerView().
// The artboard draws two innings and no academy row, so there are two rows here.
import type { CareerView } from "./view";

export const artboardCareerView: CareerView = {
  stats: [
    { label: "PRO SINCE", value: "JUL 2024", tone: "glass" },
    { label: "CLUB", value: "DEUTSCHE", tone: "glass" },
    { label: "CURRENT", value: "NOT OUT", tone: "volt" },
  ],
  cols: { inn: "INN", team: "TEAM", role: "ROLE", span: "SPAN", status: "STATUS" },
  listLabel: "Innings",
  rows: [
    {
      id: "01",
      n: "01",
      team: "DEUTSCHE BANK",
      role: "Software Engineer 1",
      span: "JUL 2024 – NOW",
      status: "NOT OUT",
      current: true,
      detail: {
        heading: "INNINGS 01 · BALL BY BALL",
        span: "JUL 2024 – NOW",
        title: "DEUTSCHE BANK",
        roleLine: "Software Engineer 1 · Pune, MH",
        balls: [
          "Improving the sanctions compliance system that keeps restricted people and entities in line with each country’s law.",
          "Supporting 200+ country-specific sanctions lists for global regulatory adherence.",
          "Designed Excel bulk upload: 10,000+ records validated per upload across 50+ fields — manual entry down 60%.",
          "Shipped dashboard features end-to-end; 75+ JUnit tests raised coverage and cut production defects.",
        ],
        footer: {
          kind: "shots",
          label: "SHOTS PLAYED",
          stack: [
            "Java",
            "Spring Boot",
            "React",
            "Redux",
            "Oracle",
            "JUnit",
            "TeamCity",
            "uDeploy",
          ],
        },
      },
    },
    {
      id: "02",
      n: "02",
      team: "DEUTSCHE BANK",
      role: "Graduate Analyst Intern",
      span: "JUN – JUL 2023",
      status: "DEBUT",
      current: false,
      detail: {
        heading: "INNINGS 02 · BALL BY BALL",
        span: "JUN – JUL 2023",
        title: "DEUTSCHE BANK",
        roleLine: "Graduate Analyst Intern · Pune, MH",
        balls: [
          "Built a Kudo Board platform from the ground up to celebrate individual and team wins for 10,000+ employees.",
          "Drove engagement with 4+ interaction types — messages, GIFs, short videos and gesture-based responses.",
          "Enabled personalised delivery so recognition lands with the right person or team.",
        ],
        footer: {
          kind: "shots",
          label: "SHOTS PLAYED",
          stack: ["React", "Spring Boot", "Oracle"],
        },
      },
    },
  ],
  legend: "NOT OUT = CURRENT ROLE · DEBUT = FIRST INNINGS",
  viewCard: { label: "VIEW PLAYER CARD", to: "/card" },
  defaultId: "01",
};
