// Artboard copy for pixel-parity stories only (Intro). Real pages use buildIntroView().
import type { IntroView } from "./view";

export const artboardIntroView: IntroView = {
  heading: "Yash Sarda",
  name: "Yash Sarda",
  title: "SOFTWARE ENGINEER",
  portraitAlt: "Yash Sarda",
  brand: { mark: "YS" },
  header: {
    live: "LIVE · PLAYER INTRODUCTION",
    matchday: "THE ARENA · MATCHDAY",
    count: "01 / 01",
  },
  tagline: [
    { kind: "word", text: "PLAYER 01", tone: "primary" },
    { kind: "sep", text: "•", tone: "volt" },
    { kind: "word", text: "ENGINEER", tone: "secondary" },
    { kind: "sep", text: "•", tone: "volt" },
    { kind: "word", text: "BUILDER", tone: "secondary" },
    { kind: "sep", text: "•", tone: "volt" },
    { kind: "word", text: "COMPETITOR", tone: "secondary" },
  ],
  footer: [
    { label: "INTRODUCING", value: "NO. 01", tone: "primary", align: "start" },
    { label: "RECORD", value: "99 – 1", tone: "primary", align: "center" },
    { label: "STATUS", value: "UNDEFEATED", tone: "volt", align: "end" },
  ],
  footerPhone: [
    { label: "RECORD", value: "99 – 1", tone: "primary", align: "start" },
    { label: "STATUS", value: "UNDEFEATED", tone: "volt", align: "end" },
  ],
  welcome: "WELCOME TO MY ARENA",
  enter: { label: "ENTER THE ARENA →", to: "/arena" },
  skip: { label: "SKIP INTRO", to: "/arena" },
  replay: "REPLAY",
  comm: "The player has entered the arena.",
  commTag: "COMM",
};
