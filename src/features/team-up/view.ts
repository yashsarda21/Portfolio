import type { Content, UiCopy } from "@/content";
import type { IconName } from "@/design-system";
import type { Format } from "./form";

export interface ChannelView {
  id: "email" | "linkedin" | "github" | "coding";
  icon: IconName;
  title: string;
  /** The address or handle under the title. */
  sub: string;
  href: string;
}

export interface TeamUpView {
  eyebrow: string;
  intro: string;
  formats: { legend: string; options: { id: Format; title: string; sub: string }[] };
  fields: Record<"name" | "email" | "message", { label: string; placeholder: string }>;
  errors: UiCopy["pages"]["teamUp"]["errors"];
  send: string;
  sending: string;
  /** Shown when sending failed (the visitor's text is still in the form). */
  error: string;
  /** The label of the honeypot field. */
  honeypot: string;
  /** The address challenges are mailed to. */
  address: string;
  orEmail: { label: string; href: string };
  skip: string;
  channels: ChannelView[];
  after: { label: string; comm: string; text: string; board: string };
  success: {
    title: string;
    again: string;
    /** Said (and shown) once a challenge is in. */
    comm: string;
    board: { fixture: string; visitor: string; versus: string; home: string };
  };
}

/** "https://www.linkedin.com/in/yash/" gives "linkedin.com/in/yash". */
function handleOf(url: string): string {
  const { hostname, pathname } = new URL(url);
  return `${hostname.replace(/^www\./, "")}${pathname.replace(/\/+$/, "")}`;
}

function problemsSolved(c: Content): string {
  const stat = c.player.cardStats.find((s) => s.label === "PROBLEMS");
  if (!stat) throw new Error('content.player.cardStats needs a "PROBLEMS" entry');
  return stat.value;
}

/** The Team Up page, as plain strings. Pure: no React, no DOM. */
export function buildTeamUpView(c: Content, copy: UiCopy): TeamUpView {
  const t = copy.pages.teamUp;
  const { contact } = c.player;
  const mailto = `mailto:${contact.email}`;
  const { formats } = t;
  return {
    eyebrow: t.eyebrow,
    intro: t.intro,
    formats: {
      legend: formats.legend,
      options: [
        { id: "sign", ...formats.sign },
        { id: "doubles", ...formats.doubles },
        { id: "rally", ...formats.rally },
      ],
    },
    fields: {
      name: { label: t.fields.name, placeholder: t.fields.namePh },
      email: { label: t.fields.email, placeholder: t.fields.emailPh },
      message: { label: t.fields.message, placeholder: t.fields.messagePh },
    },
    errors: t.errors,
    send: t.send,
    sending: t.sending,
    error: t.error,
    honeypot: t.honeypot,
    address: contact.email,
    orEmail: { label: `${t.orEmail} ${contact.email}`, href: mailto },
    skip: t.skip,
    channels: [
      { id: "email", icon: "mail", title: t.channels.email, sub: contact.email, href: mailto },
      {
        id: "linkedin",
        icon: "linkedin",
        title: t.channels.linkedin,
        sub: handleOf(contact.linkedin),
        href: contact.linkedin,
      },
      {
        id: "github",
        icon: "code",
        title: t.channels.github,
        sub: handleOf(contact.github),
        href: contact.github,
      },
      {
        id: "coding",
        icon: "terminal",
        title: t.channels.coding,
        sub: t.channels.codingSub.replace("{solved}", problemsSolved(c)),
        href: contact.leetcode,
      },
    ],
    after: { ...t.after },
    success: {
      title: t.success.title,
      again: t.success.again,
      comm: t.after.comm,
      board: { ...t.success.board },
    },
  };
}
