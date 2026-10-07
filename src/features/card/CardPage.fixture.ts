// Artboard copy for pixel-parity stories only (Player-Card). Real pages use buildCardView().
import portraitSrc from "@/assets/portrait-rest.webp";
import type { CardView } from "./view";

/** The year the artboard draws on the card. The parity story pins it (`liveYear={false}`). */
export const ARTBOARD_YEAR = 2026;

const footer = { left: "THE ARENA · NO. 01", right: "RECORD 99–1" };

export const artboardCardView: CardView = {
  titleLines: ["PLAYER", "PROFILE"],
  bio: "Software engineer with hands-on full-stack experience. I like problems that need solving properly — and software that delivers measurable, real-world impact.",
  rows: [
    { k: "Home ground", v: "Pune, India" },
    { k: "Pro debut", v: "July 2024" },
    { k: "Current club", v: "Deutsche Bank" },
    { k: "Academy", v: "PICT · CGPA 8.94", accent: true },
  ],
  front: {
    position: { value: "SE", label: "POSITION" },
    mark: "YS",
    season: { label: "SEASON", buildYear: ARTBOARD_YEAR },
    portrait: { src: portraitSrc, alt: "Yash Sarda" },
    name: "YASH SARDA",
    line: "SOFTWARE ENGINEER · DEUTSCHE BANK",
    stats: [
      { label: "PROBLEMS", value: "750+", accent: true },
      { label: "CGPA", value: "8.94", accent: true },
      { label: "CET %ILE", value: "99.5", accent: true },
      { label: "LISTS", value: "200+", accent: false },
      { label: "RECORDS", value: "10K+", accent: false },
      { label: "TESTS", value: "75+", accent: false },
    ],
    footer,
  },
  // The artboard draws only the front. The back is the page's own (C2).
  back: {
    title: "THE FULL SHEET",
    items: [
      { label: "CAREER STATS", to: "/career" },
      { label: "MATCH HIGHLIGHTS", to: "/highlights" },
      { label: "PLAYER ATTRIBUTES", to: "/attributes" },
      { label: "TROPHY ROOM", to: "/trophies" },
      { label: "TEAM UP", to: "/team-up" },
    ],
    contact: {
      label: "EMAIL",
      value: "yashsarda2002@gmail.com",
      href: "mailto:yashsarda2002@gmail.com",
    },
    footer,
  },
  hint: { pointer: "DRAG TO TILT · CLICK TO FLIP FOR FULL RESUME", touch: "TAP TO FLIP" },
  take: {
    label: "TAKE THE CARD WITH YOU",
    // The artboard's two PDF rows. Story-only: safe "#" anchors, never a real .pdf.
    actions: [
      {
        kind: "pdf-view",
        title: "VIEW PLAYER CARD",
        sub: "FULL RESUME · OPENS AS PDF",
        href: "#view",
        newTab: true,
      },
      {
        kind: "pdf-download",
        title: "DOWNLOAD PDF",
        sub: "YASH-SARDA-RESUME.PDF",
        href: "#download",
        download: "Yash-Sarda-Resume.pdf",
      },
    ],
    newTabHint: "(opens in a new tab)",
    copy: {
      title: "COPY SCOUTING LINK",
      sub: "OPENS STRAIGHT TO QUICK VIEW",
      done: "LINK COPIED ✓",
      announce: "Scouting link copied",
      fallback: "COPY THIS LINK",
      url: "https://example.dev/scout",
    },
  },
  backNote: {
    label: "ON THE BACK OF THE CARD",
    text: "Career scorecard · Match highlights · Attributes · Trophy room · Academy · Contact — the same facts as the PDF, one tap from flipping.",
    meta: "SOFTWARE ENGINEER 1 · SDE RESUME",
  },
  flip: { toBack: "Flip card: show the back", toFront: "Flip card: show the front" },
};
