// Artboard copy for pixel-parity stories only (Team-Up). Real pages use buildTeamUpView().
import type { TeamUpView } from "./view";

export const artboardTeamUpView: TeamUpView = {
  eyebrow: "CONTACT",
  intro: "You've seen how I play. I'd rather be on your side of the net.",
  formats: {
    legend: "CHOOSE YOUR FORMAT",
    options: [
      { id: "sign", title: "SIGN A PLAYER", sub: "You're hiring for a role." },
      { id: "doubles", title: "DOUBLES", sub: "Let's build something together." },
      { id: "rally", title: "FRIENDLY RALLY", sub: "Just saying hi. Or talking sport." },
    ],
  },
  fields: {
    name: { label: "YOUR NAME", placeholder: "Who's challenging?" },
    email: { label: "EMAIL", placeholder: "you@company.com" },
    message: {
      label: "THE CHALLENGE",
      placeholder: "The role, the problem, or the match you want to talk about.",
    },
  },
  prefill: "Good game, Yash.",
  errors: {
    name: "Tell me who's challenging.",
    email: "That email doesn't look right.",
    message: "Add a line or two about the challenge (at least 10 characters).",
  },
  send: "SEND CHALLENGE",
  sending: "SENDING…",
  error: "That didn't go through. Your message is still here.",
  mailto: {
    note: "YOUR EMAIL APP SHOULD OPEN WITH THE MESSAGE READY. PRESS SEND THERE.",
    copy: "COPY MESSAGE",
    copied: "MESSAGE COPIED ✓",
  },
  honeypot: "Leave this empty",
  address: "yashsarda2002@gmail.com",
  orEmail: { label: "OR EMAIL YASHSARDA2002@GMAIL.COM", href: "mailto:yashsarda2002@gmail.com" },
  skip: "OR SKIP THE FORM",
  channels: [
    {
      id: "email",
      icon: "mail",
      title: "EMAIL",
      sub: "yashsarda2002@gmail.com",
      href: "mailto:yashsarda2002@gmail.com",
    },
    {
      id: "linkedin",
      icon: "linkedin",
      title: "LINKEDIN",
      sub: "linkedin.com/in/yash-sarda2107",
      href: "https://www.linkedin.com/in/yash-sarda2107/",
    },
    {
      id: "github",
      icon: "code",
      title: "GITHUB",
      sub: "github.com/yashsarda21",
      href: "https://github.com/yashsarda21",
    },
    {
      id: "coding",
      icon: "terminal",
      title: "CODING PROFILES",
      sub: "LeetCode · Codeforces · CodeChef — 750+ solved",
      href: "https://leetcode.com/u/yash_sarda",
    },
  ],
  after: {
    label: "AFTER YOU SEND",
    comm: "Challenge received. I'll serve first.",
    text: "Floodlights pulse once, the crowd lifts, and the scoreboard reads",
    board: "NEW FIXTURE · VISITOR vs YASH",
    end: ".",
  },
  success: {
    title: "CHALLENGE RECEIVED",
    again: "SEND ANOTHER",
    comm: "Challenge received. I'll serve first.",
    board: { fixture: "NEW FIXTURE", visitor: "VISITOR", versus: "vs", home: "YASH" },
  },
};
