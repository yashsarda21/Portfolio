// Artboard copy for pixel-parity stories only (Main). Real pages use buildLandingView().
import type { LandingView } from "./view";

export const artboardLandingView: LandingView = {
  heading: "YASH SARDA",
  title: { name: "YASH SARDA", role: "SOFTWARE ENGINEER" },
  brand: { mark: "YS", label: "THE ARENA" },
  header: { live: "LIVE · THE ARENA", player: "PLAYER 01 / 01", playerShort: "01 / 01" },
  footer: [
    { label: "HOME", value: "Yash", tone: "primary", align: "start" },
    { label: "STATUS", value: "UNDEFEATED", tone: "volt", align: "center" },
    { label: "AWAY", value: "YOU?", tone: "label", align: "end" },
  ],
  challenge: "Think you can beat me?",
  enter: {
    label: "ENTER THE ARENA",
    sub: "INTERACTIVE · ~3 MIN",
    subPhone: "LITE · ONE-THUMB GAMES",
    to: "/intro",
  },
  view: { label: "VIEW PORTFOLIO", sub: "RECRUITER VIEW · 90 SEC", to: "/scout" },
  hint: "ENTER ↵ TO PLAY · Q FOR QUICK VIEW",
  comm: "New challenger enters the arena.",
  commTag: "COMM",
  skip: { label: "SKIP INTRO", to: "/arena" },
  audio: { name: "Crowd audio", label: "CROWD", labelPhone: "SOUND", on: "ON", off: "OFF" },
};
