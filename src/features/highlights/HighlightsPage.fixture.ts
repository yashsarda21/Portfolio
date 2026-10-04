// Artboard copy for pixel-parity stories only (Tennis-Highlights). Real pages use buildHighlightsView().
// The artboard draws a LIVE DEMO and a FULL CASE STUDY link on every project; the real content has none yet,
// so the in-page anchors below only keep the story free of dead `#` links.
import type { HighlightItemView, HighlightsView } from "./view";

const SEP = "·";

const links: HighlightItemView["links"] = [
  { label: "CODE ON GITHUB", href: "https://github.com/yashsarda21", tone: "outline", glyph: "↗" },
  { label: "LIVE DEMO", href: "#demo", tone: "outline", glyph: "↗" },
  { label: "FULL CASE STUDY", href: "#case-study", tone: "primary", glyph: "→" },
];

const media = (name: string, round: string): HighlightItemView["media"] => ({
  label: `[${name} ${SEP} ADD A 10s SCREEN RECORDING]`,
  badge: "REPLAY",
  round,
  video: null,
});

export const artboardHighlightsView: HighlightsView = {
  unlocked: "3 OF 3 UNLOCKED",
  drawLabel: "THE DRAW",
  listLabel: "Projects",
  shotDataLabel: "SHOT DATA",
  defaultId: "ai-interview-grooming-platform",
  items: [
    {
      id: "power-bi-dashboard",
      round: "QUARTER-FINAL",
      name: "POWER BI DASHBOARD",
      kind: "Embedded analytics platform",
      line: "An analytics-driven web platform with interactive Power BI dashboards embedded right inside it.",
      media: media("POWER BI DASHBOARD", "QUARTER-FINAL"),
      par: {
        serve: {
          label: "THE SERVE · PROBLEM",
          text: "Teams needed live, interactive Power BI reports inside their own web platform — not in a separate tool.",
        },
        rally: {
          label: "THE RALLY · APPROACH",
          text: "Used the REST-based Embedding API, with server-side logic for session management, dashboard embedding and token generation.",
        },
        winner: {
          label: "THE WINNER · RESULT",
          text: "Interactive reports that work in both desktop and mobile layouts.",
        },
      },
      facts: [
        { k: "TYPE", v: "Analytics web platform" },
        { k: "KEY PIECE", v: "Secure token generation" },
      ],
      stackLabel: "STACK",
      stack: ["Power BI Embedded", "REST API", "Token auth"],
      links,
      comm: "Another project shipped.",
    },
    {
      id: "kudo-board",
      round: "SEMI-FINAL",
      name: "KUDO BOARD",
      kind: "Deutsche Bank · built from scratch",
      line: "A recognition platform celebrating individual and team wins for 10,000+ employees.",
      media: media("KUDO BOARD", "SEMI-FINAL"),
      par: {
        serve: {
          label: "THE SERVE · PROBLEM",
          text: "Recognition across a 10,000+ person organisation was scattered and generic.",
        },
        rally: {
          label: "THE RALLY · APPROACH",
          text: "Built it from the ground up with 4+ interaction types — messages, GIFs, short videos and gesture-based responses.",
        },
        winner: {
          label: "THE WINNER · RESULT",
          text: "Personalised delivery to the right person or team, across 10,000+ employees.",
        },
      },
      facts: [
        { k: "TYPE", v: "Internship project · Deutsche Bank" },
        { k: "REACH", v: "10,000+ employees" },
      ],
      stackLabel: "STACK",
      stack: ["React", "Spring Boot", "Oracle"],
      links,
      comm: "Another project shipped.",
    },
    {
      id: "ai-interview-grooming-platform",
      round: "THE FINAL",
      name: "AI INTERVIEW GROOMING PLATFORM",
      kind: "Published research",
      line: "A conversational AI interviewer that asks real follow-ups and scores you at the end.",
      media: media("AI INTERVIEW GROOMING PLATFORM", "THE FINAL"),
      par: {
        serve: {
          label: "THE SERVE · PROBLEM",
          text: "Interview practice rarely feels real — no follow-up questions, no honest score.",
        },
        rally: {
          label: "THE RALLY · APPROACH",
          text: "Google Gemini generates questions, asks follow-ups based on your answers and evaluates them. React client, Node.js server, Firebase for auth and real-time data.",
        },
        winner: {
          label: "THE WINNER · RESULT",
          text: "An end-of-interview score and feedback — and a paper published in a journal.",
        },
      },
      facts: [
        { k: "TYPE", v: "Academic project · PICT" },
        { k: "RECOGNITION", v: "Journal publication" },
      ],
      stackLabel: "STACK",
      stack: ["React", "Node.js", "Firebase", "Google Gemini", "Gen AI"],
      links,
      comm: "Match point. This one went the distance.",
    },
  ],
};
