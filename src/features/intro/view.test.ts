import { describe, expect, it } from "vitest";
import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { buildIntroView } from "./view";

const view = buildIntroView(content, ui, ROUTES);

describe("buildIntroView", () => {
  it("the name is the heading, the letters and the title come from the player", () => {
    expect(view.heading).toBe(content.player.name);
    expect(view.name).toBe(content.player.name);
    expect(view.title).toBe(content.player.title);
    expect(view.portraitAlt).toBe(ui.intro.portraitAlt);
  });

  it("the board header and the welcome line come from ui.intro", () => {
    expect(view.header).toEqual({
      live: ui.intro.live,
      matchday: ui.intro.matchday,
      count: ui.landing.playerShort,
    });
    expect(view.welcome).toBe(ui.intro.welcome);
  });

  it("the tagline is four words with three volt separators between them", () => {
    const words = view.tagline.filter((t) => t.kind === "word");
    const seps = view.tagline.filter((t) => t.kind === "sep");
    expect(words.map((w) => w.text)).toEqual([...ui.intro.tagline]);
    expect(words).toHaveLength(4);
    expect(seps).toHaveLength(3);
    for (const sep of seps)
      expect(sep).toEqual({ kind: "sep", text: ui.glyph.bullet, tone: "volt" });
    // words and separators alternate, starting and ending on a word
    expect(view.tagline.map((t) => t.kind)).toEqual([
      "word",
      "sep",
      "word",
      "sep",
      "word",
      "sep",
      "word",
    ]);
    // PLAYER 01 is the bright one
    expect(view.tagline[0]!.tone).toBe("primary");
    expect(view.tagline[2]!.tone).toBe("secondary");
  });

  it("the footer is INTRODUCING / RECORD / STATUS; the record is written once, in ui.record", () => {
    expect(view.footer).toEqual([
      { label: ui.intro.introducing, value: ui.intro.number, tone: "primary", align: "start" },
      { label: ui.record.label, value: ui.record.value, tone: "primary", align: "center" },
      { label: ui.landing.status, value: ui.landing.undefeated, tone: "volt", align: "end" },
    ]);
    expect(ui.record.career).toBe(`${ui.record.label} ${ui.record.value}`);
  });

  it("the phone board's footer is two cells, RECORD and STATUS, from the same copy as the wide board's", () => {
    expect(view.footerPhone).toEqual([
      { label: ui.record.label, value: ui.record.value, tone: "primary", align: "start" },
      { label: ui.landing.status, value: ui.landing.undefeated, tone: "volt", align: "end" },
    ]);
  });

  it("ENTER THE ARENA and SKIP INTRO both go to the Arena Hub", () => {
    expect(view.enter).toEqual({ label: `${ui.intro.enter} ${ui.glyph.next}`, to: ROUTES.arena });
    expect(view.skip).toEqual({ label: ui.hud.skipIntro, to: ROUTES.arena });
    expect(view.enter.to).toBe("/arena");
    expect(view.skip.to).toBe("/arena");
    expect(view.replay).toBe(ui.hud.replay);
  });

  it("the commentary is the intro's first line, tagged COMM; the brand is the mark alone", () => {
    expect(view.comm).toBe(content.commentary.intro[0]);
    expect(view.commTag).toBe(ui.comm.tag);
    expect(view.brand).toEqual({ mark: ui.brand.mark });
  });
});
