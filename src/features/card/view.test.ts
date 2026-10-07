import { describe, expect, it } from "vitest";
import { content, ui, type Content } from "@/content";
import { ROUTES } from "@/shell/routes";
import { buildCardView } from "./view";

const OPTS = {
  portraitSrc: "/assets/portrait.webp",
  origin: "https://example.dev",
  buildYear: 2026,
};
const build = (c: Content = content, opts = OPTS) => buildCardView(c, ui, ROUTES, opts);
const withResume = (): Content =>
  ({ ...content, player: { ...content.player, resumePdf: "/files/resume.pdf" } }) as Content;

describe("buildCardView", () => {
  it("title, bio and the profile rows: home ground, pro debut (long month), club, academy (accent)", () => {
    const v = build();
    expect(v.titleLines).toEqual(["PLAYER", "PROFILE"]);
    expect(v.bio).toBe(content.player.cardBio);
    expect(v.rows).toEqual([
      { k: "Home ground", v: "Pune, India" },
      { k: "Pro debut", v: "July 2024" },
      { k: "Current club", v: "Deutsche Bank" },
      { k: "Academy", v: "PICT · CGPA 8.94", accent: true },
    ]);
  });

  describe("front", () => {
    it("position, mark, season, portrait, name and line", () => {
      const { front } = build();
      expect(front.position).toEqual({ value: "SE", label: "POSITION" });
      expect(front.mark).toBe("YS");
      expect(front.season).toEqual({ label: "SEASON", buildYear: 2026 });
      expect(front.portrait).toEqual({ src: OPTS.portraitSrc, alt: "Yash Sarda" });
      expect(front.name).toBe("Yash Sarda");
      expect(front.line).toBe("Software Engineer · Deutsche Bank");
    });

    it("six stats, the first three accented", () => {
      const { stats } = build().front;
      expect(stats).toHaveLength(6);
      expect(stats.map((s) => s.accent)).toEqual([true, true, true, false, false, false]);
      expect(stats[0]).toEqual({ label: "PROBLEMS", value: "750+", accent: true });
    });

    it("the build year is the one passed in", () => {
      expect(build(content, { ...OPTS, buildYear: 2031 }).front.season.buildYear).toBe(2031);
    });

    it("footer: the issue number and the career record", () => {
      expect(build().front.footer).toEqual({
        left: "THE ARENA · NO. 01",
        right: ui.record.career,
      });
    });
  });

  describe("back", () => {
    it("is an index to career, highlights, attributes, trophies and team up", () => {
      const { back } = build();
      expect(back.title).toBe("THE FULL SHEET");
      expect(back.items).toEqual([
        { label: "CAREER STATS", to: ROUTES.career },
        { label: "MATCH HIGHLIGHTS", to: ROUTES.highlights },
        { label: "PLAYER ATTRIBUTES", to: ROUTES.attributes },
        { label: "TROPHY ROOM", to: ROUTES.trophies },
        { label: "TEAM UP", to: ROUTES.teamUp },
      ]);
    });

    it("says how to reach the player: the address, as a mail link, labelled from the copy", () => {
      expect(build().back.contact).toEqual({
        label: ui.pages.teamUp.channels.email,
        value: content.player.contact.email,
        href: `mailto:${content.player.contact.email}`,
      });
    });

    it("keeps the front's footer", () => {
      const v = build();
      expect(v.back.footer).toEqual(v.front.footer);
      expect(v.back.footer.right).toBe(ui.record.career);
    });
  });

  it("hint and flip labels come from the copy", () => {
    const v = build();
    expect(v.hint).toEqual({
      pointer: "DRAG TO TILT · CLICK TO FLIP FOR FULL RESUME",
      touch: "TAP TO FLIP",
    });
    expect(v.flip).toEqual({
      toBack: "Flip card: show the back",
      toFront: "Flip card: show the front",
    });
    expect(v.backNote.label).toBe("ON THE BACK OF THE CARD");
  });

  describe("take away", () => {
    it("with no public PDF there is exactly one action: a mailto request, and no .pdf anywhere", () => {
      const { take } = build();
      expect(take.actions).toHaveLength(1);
      const [request] = take.actions;
      expect(request).toMatchObject({ kind: "request", title: "REQUEST RESUME" });
      expect(request!.href).toMatch(/^mailto:/);
      expect(request!.newTab).toBeUndefined();
      expect(request!.download).toBeUndefined();
      expect(JSON.stringify(take).toLowerCase()).not.toContain(".pdf");
    });

    it("with a PDF: view opens a new tab, download carries the file name", () => {
      const { take } = build(withResume());
      expect(take.actions.map((a) => a.kind)).toEqual(["pdf-view", "pdf-download"]);
      const [view, download] = take.actions;
      expect(view).toMatchObject({
        title: "VIEW PLAYER CARD",
        href: "/files/resume.pdf",
        newTab: true,
      });
      expect(view!.download).toBeUndefined();
      expect(download).toMatchObject({
        title: "DOWNLOAD PDF",
        href: "/files/resume.pdf",
        download: ui.scout.resume.fileName,
      });
      expect(download!.newTab).toBeUndefined();
    });

    it("the copy row links to the scouting page on the given origin", () => {
      const { copy } = build().take;
      expect(copy.url).toBe(`https://example.dev${ROUTES.scout}`);
      expect(copy).toMatchObject({
        title: "COPY SCOUTING LINK",
        done: "LINK COPIED ✓",
        announce: ui.a11y.copied,
        fallback: "COPY THIS LINK",
      });
      expect(build().take.newTabHint).toBe(ui.a11y.newTab);
    });

    it("prerender passes no origin, so the link stays a relative path", () => {
      expect(build(content, { ...OPTS, origin: "" }).take.copy.url).toBe(ROUTES.scout);
    });
  });
});
