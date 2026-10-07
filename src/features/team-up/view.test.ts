import { describe, expect, it } from "vitest";
import { content, ui } from "@/content";
import { buildTeamUpView } from "./view";

const view = buildTeamUpView(content, ui);
const { contact } = content.player;

describe("buildTeamUpView", () => {
  it("lists the formats in order: sign, doubles, rally", () => {
    expect(view.formats.legend).toBe(ui.pages.teamUp.formats.legend);
    expect(view.formats.options.map((o) => o.id)).toEqual(["sign", "doubles", "rally"]);
    expect(view.formats.options.map((o) => o.title)).toEqual([
      "SIGN A PLAYER",
      "DOUBLES",
      "FRIENDLY RALLY",
    ]);
    expect(view.formats.options[0]!.sub).toBe("You're hiring for a role.");
  });

  it("lists the four channels in order, with hrefs from the contact content", () => {
    expect(view.channels.map((ch) => ch.id)).toEqual(["email", "linkedin", "github", "coding"]);
    expect(view.channels.map((ch) => ch.href)).toEqual([
      `mailto:${contact.email}`,
      contact.linkedin,
      contact.github,
      contact.leetcode,
    ]);
    expect(view.channels.map((ch) => ch.title)).toEqual([
      "EMAIL",
      "LINKEDIN",
      "GITHUB",
      "CODING PROFILES",
    ]);
  });

  it("shows each channel's handle without the scheme, www or a trailing slash", () => {
    expect(view.channels.map((ch) => ch.sub).slice(0, 3)).toEqual([
      contact.email,
      "linkedin.com/in/yash-sarda2107",
      "github.com/yashsarda21",
    ]);
  });

  it("fills the coding line with the problems solved from the card stats", () => {
    const coding = view.channels.find((ch) => ch.id === "coding")!;
    expect(coding.sub).toBe("LeetCode · Codeforces · CodeChef — 750+ solved");
    expect(coding.sub).not.toContain("{");
  });

  it("gives the OR EMAIL line and the address it mails", () => {
    expect(view.address).toBe(contact.email);
    expect(view.orEmail).toEqual({
      label: `OR EMAIL ${contact.email}`,
      href: `mailto:${contact.email}`,
    });
  });

  it("carries the page, field, error and send copy", () => {
    expect(view.intro).toBe(ui.pages.teamUp.intro);
    expect(view.fields.name).toEqual({ label: "YOUR NAME", placeholder: "Who's challenging?" });
    expect(view.fields.email.label).toBe("EMAIL");
    expect(view.fields.message.label).toBe("THE CHALLENGE");
    expect(view.errors).toEqual(ui.pages.teamUp.errors);
    expect([view.send, view.sending, view.error]).toEqual([
      "SEND CHALLENGE",
      "SENDING…",
      "That didn't go through. Your message is still here.",
    ]);
    expect(view.honeypot).toBe(ui.pages.teamUp.honeypot);
    expect(view.skip).toBe("OR SKIP THE FORM");
  });

  it("describes what happens after sending, and the success panel says the same line", () => {
    expect(view.after).toEqual({
      label: "AFTER YOU SEND",
      comm: "Challenge received. I'll serve first.",
      text: "Floodlights pulse once, the crowd lifts, and the scoreboard reads",
      board: "NEW FIXTURE · VISITOR vs YASH",
    });
    expect(view.success.title).toBe("CHALLENGE RECEIVED");
    expect(view.success.again).toBe("SEND ANOTHER");
    expect(view.success.comm).toBe(view.after.comm);
  });

  it("splits the fixture strip into parts that read as the same board line", () => {
    const { fixture, visitor, versus, home } = view.success.board;
    expect(`${fixture} · ${visitor} ${versus} ${home}`).toBe(view.after.board);
  });
});
