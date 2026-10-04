import { describe, expect, it } from "vitest";
import raw from "./content.json";
import { ContentError, parseContent } from "./schema";

describe("content schema", () => {
  it("accepts the real content file", () => {
    expect(() => parseContent(raw)).not.toThrow();
  });

  it("parses to exactly the raw data (guards the `as unknown as Content` cast in index.ts)", () => {
    expect(parseContent(raw)).toEqual(raw);
  });

  it("reports the path of a missing field", () => {
    const broken = structuredClone(raw) as Record<string, unknown>;
    const highlights = broken.matchHighlights as Array<Record<string, unknown>>;
    delete highlights[1]!.name;
    expect(() => parseContent(broken)).toThrow(ContentError);
    expect(() => parseContent(broken)).toThrow(/matchHighlights\.1\.name/);
  });

  it("rejects a malformed month", () => {
    const broken = structuredClone(raw) as { player: { proSince: string } };
    broken.player.proSince = "July 2024";
    expect(() => parseContent(broken)).toThrow(/player\.proSince/);
  });

  it("rejects an unknown skill level", () => {
    const broken = structuredClone(raw) as {
      playerAttributes: { groups: Array<{ skills: unknown[][] }> };
    };
    broken.playerAttributes.groups[0]!.skills[0] = ["Java", "pro"];
    expect(() => parseContent(broken)).toThrow(/playerAttributes\.groups\.0\.skills\.0/);
  });

  it("never allows a resume PDF path that is not public", () => {
    const broken = structuredClone(raw) as { player: { resumePdf: string | null } };
    broken.player.resumePdf = "assets/Yash-Sarda-Resume.pdf";
    expect(() => parseContent(broken)).toThrow(/player\.resumePdf/);
  });
  describe("strictness (spec §6)", () => {
    // Loosely typed clone so each test can break one thing.
    type Loose = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    const clone = () => structuredClone(raw) as unknown as Loose;

    it("rejects a missing commentary key with its path", () => {
      const broken = clone();
      delete broken.commentary.yashWins;
      expect(() => parseContent(broken)).toThrow(/commentary\.yashWins/);
    });

    it("rejects a misspelled commentary key", () => {
      const broken = clone();
      broken.commentary.yashwins = ["typo"];
      expect(() => parseContent(broken)).toThrow(/commentary/);
    });

    it("rejects an unknown key on any object, with its path", () => {
      const broken = clone();
      broken.matchHighlights[0].medai = "x";
      expect(() => parseContent(broken)).toThrow(/matchHighlights\.0/);
      expect(() => parseContent(broken)).toThrow(/medai/);
    });

    it("rejects duplicate highlight rounds", () => {
      const broken = clone();
      broken.matchHighlights[0].round = "THE FINAL";
      broken.matchHighlights[1].round = "THE FINAL";
      expect(() => parseContent(broken)).toThrow(/matchHighlights/);
    });

    it("rejects duplicate trophy types", () => {
      const broken = clone();
      broken.trophyRoom[1].type = "cup";
      expect(() => parseContent(broken)).toThrow(/trophyRoom/);
    });

    it("rejects a career whose end is before its start", () => {
      const broken = clone();
      broken.careerStats[1].start = "2023-07";
      broken.careerStats[1].end = "2023-06";
      expect(() => parseContent(broken)).toThrow(/careerStats\.1/);
    });

    it("rejects NOT OUT with an end date, and an ended-less DEBUT", () => {
      const a = clone();
      a.careerStats[0].end = "2025-01";
      expect(() => parseContent(a)).toThrow(/careerStats\.0/);
      const b = clone();
      b.careerStats[1].end = null;
      expect(() => parseContent(b)).toThrow(/careerStats\.1/);
    });

    it("rejects an academy that ends before it starts", () => {
      const broken = clone();
      broken.trainingAcademy.start = "2024-06";
      broken.trainingAcademy.end = "2020-07";
      expect(() => parseContent(broken)).toThrow(/trainingAcademy/);
    });

    it.each([
      "//evil.example/x.pdf",
      "/../secret.pdf",
      "/Yash-Sarda-Resume.pdf",
      "/files/Yash-Sarda-Resume.pdf",
    ])("rejects resume path %s", (path) => {
      const broken = clone();
      broken.player.resumePdf = path;
      expect(() => parseContent(broken)).toThrow(/player\.resumePdf/);
    });

    it("still accepts the public resume file name", () => {
      const ok = clone();
      ok.player.resumePdf = "/Yash-Sarda-Resume-public.pdf";
      expect(() => parseContent(ok)).not.toThrow();
    });

    it("rejects a non-https contact URL", () => {
      const broken = clone();
      broken.player.contact.github = "javascript:alert(1)";
      expect(() => parseContent(broken)).toThrow(/player\.contact\.github/);
      broken.player.contact.github = "http://github.com/x";
      expect(() => parseContent(broken)).toThrow(/player\.contact\.github/);
    });

    it("rejects an unsafe trophy link", () => {
      const broken = clone();
      broken.trophyRoom[0].links[0].href = "javascript:alert(1)";
      expect(() => parseContent(broken)).toThrow(/trophyRoom\.0\.links\.0\.href/);
      broken.trophyRoom[0].links[0].href = "//evil.example";
      expect(() => parseContent(broken)).toThrow(/trophyRoom\.0\.links\.0\.href/);
    });

    describe("project media", () => {
      const withMedia = (media: unknown) => {
        const c = clone();
        c.matchHighlights[0].media = media;
        return c;
      };

      it("accepts a silent screen recording with a poster", () => {
        expect(() =>
          parseContent(withMedia({ src: "/media/ai.mp4", poster: "/media/ai.png", silent: true })),
        ).not.toThrow();
      });

      it("accepts a recording with sound when it has captions", () => {
        expect(() =>
          parseContent(
            withMedia({
              src: "https://cdn.example.com/ai.mp4",
              captions: "/media/ai.vtt",
              silent: false,
            }),
          ),
        ).not.toThrow();
      });

      it("rejects a recording with sound and no captions", () => {
        expect(() => parseContent(withMedia({ src: "/media/ai.mp4", silent: false }))).toThrow(
          /matchHighlights\.0\.media\.captions/,
        );
      });

      it.each([
        ["a bare string (the old shape)", "/media/ai.mp4"],
        ["an empty src", { src: "", silent: true }],
        ["an http src", { src: "http://example.com/a.mp4", silent: true }],
        ["a protocol-relative src", { src: "//evil.example/a.mp4", silent: true }],
        ["a relative src", { src: "media/a.mp4", silent: true }],
        ["a javascript: poster", { src: "/a.mp4", poster: "javascript:alert(1)", silent: true }],
        ["a missing silent flag", { src: "/a.mp4" }],
        ["an unknown key", { src: "/a.mp4", silent: true, autoplay: true }],
      ])("rejects %s", (_name, media) => {
        expect(() => parseContent(withMedia(media))).toThrow(/matchHighlights\.0\.media/);
      });
    });

    describe("Quick View fields", () => {
      const required: Array<[string, (c: Loose) => Loose]> = [
        ["scout.summary", (c) => c.scout],
        ["scout.summaryShort", (c) => c.scout],
        ["scout.craftAndTools", (c) => c.scout],
        ["careerStats.0.shortRole", (c) => c.careerStats[0]],
        ["matchHighlights.0.scoutTag", (c) => c.matchHighlights[0]],
        ["matchHighlights.0.shortName", (c) => c.matchHighlights[0]],
        ["matchHighlights.0.scoutShort", (c) => c.matchHighlights[0]],
        ["trainingAcademy.degreeShort", (c) => c.trainingAcademy],
      ];

      it.each(required)("requires %s", (path, parent) => {
        const broken = clone();
        delete parent(broken)[path.split(".").pop()!];
        expect(() => parseContent(broken)).toThrow(new RegExp(path.replaceAll(".", "\\.")));
      });

      it("requires scout.craftAndTools to be non-empty", () => {
        const broken = clone();
        broken.scout.craftAndTools = [];
        expect(() => parseContent(broken)).toThrow(/scout\.craftAndTools/);
      });

      it("requires scout.craftAndTools to be unique", () => {
        const broken = clone();
        broken.scout.craftAndTools = ["Python", "Python"];
        expect(() => parseContent(broken)).toThrow(/scout\.craftAndTools/);
      });
    });

    describe("Phase 2A content fields", () => {
      it("requires player.clubShort", () => {
        const broken = clone();
        delete broken.player.clubShort;
        expect(() => parseContent(broken)).toThrow(/player\.clubShort/);
      });

      it("accepts a highlight with https links, and without links", () => {
        const ok = clone();
        ok.matchHighlights[0].links = {
          code: "https://github.com/x/y",
          demo: "https://x.example",
          caseStudy: "https://x.example/case",
        };
        expect(() => parseContent(ok)).not.toThrow();
        ok.matchHighlights[0].links = {};
        expect(() => parseContent(ok)).not.toThrow();
      });

      it.each(["http://x.example", "#"])("rejects links.demo %s", (demo) => {
        const broken = clone();
        broken.matchHighlights[0].links = { demo };
        expect(() => parseContent(broken)).toThrow(/matchHighlights\.0\.links\.demo/);
      });

      it("rejects an unknown key inside links", () => {
        const broken = clone();
        broken.matchHighlights[0].links = { demo: "https://x.example", blog: "https://x.example" };
        expect(() => parseContent(broken)).toThrow(/matchHighlights\.0\.links/);
        expect(() => parseContent(broken)).toThrow(/blog/);
      });
    });

    describe("Phase 2B content fields", () => {
      it.each(["position", "playingStyle"])("requires player.%s", (key) => {
        const broken = clone();
        delete broken.player[key];
        expect(() => parseContent(broken)).toThrow(new RegExp(`player\\.${key}`));
        broken.player[key] = "";
        expect(() => parseContent(broken)).toThrow(new RegExp(`player\\.${key}`));
      });

      it("makes trophyRoom shortSub optional but non-empty when present", () => {
        const ok = clone();
        delete ok.trophyRoom[0].shortSub;
        expect(() => parseContent(ok)).not.toThrow();
        ok.trophyRoom[0].shortSub = "Short";
        expect(() => parseContent(ok)).not.toThrow();
        ok.trophyRoom[0].shortSub = "";
        expect(() => parseContent(ok)).toThrow(/trophyRoom\.0\.shortSub/);
      });
    });

    describe("Link.href", () => {
      const withHref = (href: string) => {
        const c = clone();
        c.trophyRoom[0].links[0].href = href;
        return c;
      };

      it.each(["/\\evil.com", "//evil.com"])("rejects %s", (href) => {
        expect(() => parseContent(withHref(href))).toThrow(/trophyRoom\.0\.links\.0\.href/);
      });

      it.each(["/trophies#academy", "https://x.y", "mailto:a@b.c"])("accepts %s", (href) => {
        expect(() => parseContent(withHref(href))).not.toThrow();
      });
    });
  });
});
