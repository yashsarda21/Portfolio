// Artboard copy for pixel-parity stories only. Real pages use buildScoutReport().
import type { ScoutReport } from "./report";

const external = "↗";

export const artboardReport: ScoutReport = {
  header: {
    mark: "YS",
    label: "SCOUTING REPORT",
    nav: [
      { id: "career", label: "CAREER" },
      { id: "highlights", label: "HIGHLIGHTS" },
      { id: "attributes", label: "ATTRIBUTES" },
      { id: "trophies", label: "TROPHIES" },
      { id: "teamup", label: "TEAM UP" },
    ],
    navLabel: "Sections",
    enter: { label: "ENTER THE ARENA", to: "/arena" },
    enterShort: "ARENA",
    next: "→",
  },
  hero: {
    eyebrow: "90-SECOND READ",
    eyebrowMore: "EVERYTHING, NO GAMES",
    sep: "·",
    nameParts: ["YASH", "SARDA"],
    summary:
      "Software Engineer at Deutsche Bank. Full-stack — Java, Spring Boot, React and Oracle — building practical software that delivers measurable, real-world impact.",
    summaryShort:
      "Software Engineer at Deutsche Bank. Full-stack: Java, Spring Boot, React, Oracle.",
    chips: [
      { label: "PUNE, INDIA" },
      { label: "SOFTWARE ENGINEER 1 · SINCE JUL 2024", short: "SE1 · SINCE 2024" },
      { label: "B.TECH IT · PICT · CGPA 8.94", desktopOnly: true },
      { label: "750+ PROBLEMS SOLVED", short: "750+ SOLVED", highlight: true },
    ],
    primary: { label: "VIEW PLAYER CARD (PDF)", href: "#", glyph: "", newTab: true },
    secondary: { label: "TEAM UP", href: "#teamup" },
  },
  career: {
    title: "CAREER STATS",
    meta: "EXPERIENCE · MOST RECENT FIRST",
    metaShort: "2 INNINGS",
    rows: [
      {
        span: "JUL 2024 – NOW",
        status: "NOT OUT",
        isCurrent: true,
        team: "DEUTSCHE BANK",
        roleLine: "Software Engineer 1 · Pune",
        stackLine: "React · Spring Boot · Java · Oracle · Redux · JUnit · TeamCity · uDeploy",
        bullets: [
          "Improving a sanctions compliance system supporting 200+ country-specific sanctions lists.",
          "Designed Excel bulk upload validating 10,000+ records per upload across 50+ fields — cut manual data entry by 60%.",
          "Shipped dashboard features with end-to-end backend integration.",
          "Wrote 75+ JUnit tests, raising coverage and reducing production defects.",
        ],
        compactTitle: "DEUTSCHE BANK",
        compactLine: "Software Engineer 1 · bulk upload cut manual entry 60%",
      },
      {
        span: "JUN 2023 – JUL 2023",
        status: "DEBUT",
        isCurrent: false,
        team: "DEUTSCHE BANK",
        roleLine: "Graduate Analyst Intern · Pune",
        stackLine: "React · Spring Boot · Oracle",
        bullets: [
          "Built a Kudo Board recognition platform from scratch for 10,000+ employees.",
          "4+ interaction types — messages, GIFs, short videos and gesture-based responses.",
          "Personalised delivery of recognition to individuals and teams.",
        ],
        compactTitle: "DEUTSCHE BANK · INTERN",
      },
    ],
  },
  highlights: {
    title: "MATCH HIGHLIGHTS",
    meta: "PROJECTS · STRONGEST FIRST",
    swipe: "SWIPE",
    next: "→",
    listLabel: "Projects",
    more: { label: "MORE ON GITHUB", href: "https://github.com/yashsarda21", glyph: external },
    items: [
      {
        round: "THE FINAL",
        tag: "PUBLISHED RESEARCH",
        sep: "·",
        title: "AI INTERVIEW GROOMING PLATFORM",
        shortTitle: "AI INTERVIEW PLATFORM",
        body: "A conversational AI interviewer: Google Gemini generates questions, asks follow-ups based on your answers, evaluates them and scores you at the end. Published in a journal.",
        short: "Gemini-powered mock interviews · published paper",
        stackLine: "React · Node.js · Firebase · Gemini",
        featured: true,
      },
      {
        round: "SEMI-FINAL",
        tag: "DEUTSCHE BANK",
        sep: "·",
        title: "KUDO BOARD",
        shortTitle: "KUDO BOARD",
        body: "A recognition platform built from the ground up for 10,000+ employees, with messages, GIFs, short videos and gesture-based responses.",
        short: "",
        stackLine: "React · Spring Boot · Oracle",
        featured: false,
      },
      {
        round: "QUARTER-FINAL",
        tag: "ANALYTICS",
        sep: "·",
        title: "POWER BI DASHBOARD",
        shortTitle: "POWER BI DASHBOARD",
        body: "Interactive Power BI dashboards embedded via the REST Embedding API, with server-side session management and token generation — on desktop and mobile.",
        short: "Embedded Power BI with secure token auth",
        stackLine: "Power BI Embedded · REST API",
        featured: false,
      },
    ],
  },
  attributes: {
    title: "PLAYER ATTRIBUTES",
    meta: "SKILLS",
    legend: "FILLED = SHIPPED IN PRODUCTION AT DEUTSCHE BANK",
    groups: [
      {
        name: "BACKEND",
        chips: [
          { label: "Java", filled: true },
          { label: "Spring Boot", filled: true },
          { label: "JUnit", filled: true },
          { label: "Apache Kafka", filled: false },
        ],
      },
      {
        name: "FRONTEND",
        chips: [
          { label: "React", filled: true },
          { label: "Redux", filled: true },
          { label: "JavaScript", filled: false },
          { label: "HTML / CSS", filled: false },
        ],
      },
      {
        name: "DATA",
        chips: [
          { label: "Oracle", filled: true },
          { label: "SQL", filled: true },
          { label: "MySQL", filled: false },
          { label: "MongoDB", filled: false },
        ],
      },
      {
        name: "CRAFT & TOOLS",
        chips: [
          { label: "DSA · OOP", filled: false },
          { label: "System Design", filled: false },
          { label: "Python", filled: false },
          { label: "Git · CI/CD", filled: false },
          { label: "Google Cloud", filled: false },
          { label: "Gen AI", filled: false },
        ],
      },
    ],
  },
  trophies: {
    title: "TROPHY ROOM",
    rows: [
      { title: "750+ problems solved", sub: "LEETCODE · CODEFORCES · CODECHEF" },
      { title: "Published research paper", sub: "AI INTERVIEW PLATFORM" },
      { title: "MHT-CET 99.5 percentile", sub: "STATE MERIT RANK 709 · 2020" },
      { title: "System design blogs", sub: "LINKEDIN" },
    ],
  },
  academy: {
    title: "TRAINING ACADEMY",
    school: "Pune Institute of Computer Technology (PICT)",
    degreeLine: "B.Tech, Information Technology · Distinction, SPPU",
    datesLine: "JUL 2020 – JUN 2024 · CGPA 8.94",
  },
  teamUp: {
    eyebrow: "TEAM UP",
    headline: "THINK YOU CAN BEAT ME? LET'S FIND OUT ON A REAL PROBLEM.",
    links: [
      { label: "yashsarda2002@gmail.com", href: "mailto:yashsarda2002@gmail.com", glyph: external },
      {
        label: "LinkedIn · yash-sarda2107",
        href: "https://www.linkedin.com/in/yash-sarda2107/",
        glyph: external,
      },
      { label: "GitHub · yashsarda21", href: "https://github.com/yashsarda21", glyph: external },
      { label: "Resume (PDF)", href: "#", glyph: "↓", download: "Yash-Sarda-Resume.pdf" },
    ],
  },
  footer: {
    credit: "YASH SARDA · SOFTWARE ENGINEER",
    arena: { label: "PREFER THE FULL EXPERIENCE? ENTER THE ARENA", to: "/arena" },
    next: "→",
  },
  actions: {
    label: "Quick actions",
    card: { label: "PLAYER CARD", to: "/card" },
    teamUp: { label: "TEAM UP", href: "#teamup" },
  },
};
