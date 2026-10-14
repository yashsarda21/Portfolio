// Artboard copy for pixel-parity stories only (Trophy-Room). Real pages use buildTrophiesView().
import type { TrophiesView } from "./view";

export const artboardTrophiesView: TrophiesView = {
  listLabel: "Trophies",
  trophies: [
    {
      id: "cup",
      kind: "cup",
      title: "750+ PROBLEMS SOLVED",
      shelfSub: "LEETCODE · CODEFORCES · CODECHEF",
      detail: {
        index: "1 / 5",
        title: "750+ PROBLEMS SOLVED",
        sub: "LEETCODE · CODEFORCES · CODECHEF",
        description:
          "Competitive programming across three platforms — the daily practice behind fast, clean problem-solving on the job.",
        links: [
          { label: "LEETCODE", href: "https://leetcode.com/u/yash_sarda" },
          { label: "CODEFORCES", href: "https://codeforces.com/profile/yashsarda2002" },
          { label: "CODECHEF", href: "https://www.codechef.com/users/yash0721" },
        ],
      },
    },
    {
      id: "medal",
      kind: "medal",
      title: "99.5 PERCENTILE",
      shelfSub: "MHT-CET 2020 · STATE RANK 709",
      label: "99.5",
      detail: {
        index: "2 / 5",
        title: "99.5 PERCENTILE",
        sub: "MHT-CET 2020 · STATE RANK 709",
        description: "",
        links: [],
      },
    },
    {
      id: "plaque",
      kind: "plaque",
      title: "PUBLISHED RESEARCH",
      shelfSub: "AI INTERVIEW PLATFORM · JOURNAL",
      label: "PAPER",
      detail: {
        index: "3 / 5",
        title: "PUBLISHED RESEARCH",
        sub: "AI INTERVIEW PLATFORM · JOURNAL",
        description: "",
        links: [],
      },
    },
    {
      id: "pennant",
      kind: "pennant",
      title: "DISTINCTION · CGPA 8.94",
      shelfSub: "SPPU · B.TECH 2024",
      detail: {
        index: "4 / 5",
        title: "DISTINCTION · CGPA 8.94",
        sub: "SPPU · B.TECH 2024",
        description: "",
        links: [],
      },
    },
    {
      id: "round",
      kind: "round",
      title: "SYSTEM DESIGN BLOGS",
      shelfSub: "WRITTEN & SHARED ON LINKEDIN",
      detail: {
        index: "5 / 5",
        title: "SYSTEM DESIGN BLOGS",
        sub: "WRITTEN & SHARED ON LINKEDIN",
        description: "",
        links: [],
      },
    },
  ],
  defaultId: "cup",
  plinthLabel: "ON THE PLINTH",
  academy: {
    id: "academy",
    eyebrow: "EDUCATION",
    aside: "WHERE THE FUNDAMENTALS CAME FROM",
    title: "TRAINING ACADEMY",
    monogram: "PICT",
    name: "Pune Institute of Computer Technology",
    degree: "B.Tech, Information Technology",
    meta: "JUL 2020 – JUN 2024 · CGPA 8.94 · DISTINCTION",
    extrasLabel: "EXTRA DRILLS",
    extras:
      "Published paper: AI-Enhanced Interview Grooming Platform · MHT-CET 99.5 percentile, State Merit Rank 709",
    extraItems: [
      "Published paper: AI-Enhanced Interview Grooming Platform",
      "MHT-CET 99.5 percentile, State Merit Rank 709",
    ],
  },
};
