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
});
