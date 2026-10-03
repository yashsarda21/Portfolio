import { describe, expect, it } from "vitest";
import raw from "./content.json";
import { ContentError, parseContent } from "./schema";

describe("content schema", () => {
  it("accepts the real content file", () => {
    expect(() => parseContent(raw)).not.toThrow();
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

    it("rejects an empty media string", () => {
      const broken = clone();
      broken.matchHighlights[0].media = "";
      expect(() => parseContent(broken)).toThrow(/matchHighlights\.0\.media/);
    });
  });
});
