import { describe, expect, it } from "vitest";
import { content, getPlayerFirstName, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { buildLandingView } from "./view";

const view = buildLandingView(content, ui, ROUTES);

describe("buildLandingView", () => {
  it("the name is the heading and the title; the header and footer come from ui.landing", () => {
    expect(view.heading).toBe(ui.routes.home.heading);
    expect(view.title).toEqual({ name: content.player.name, role: content.player.title });
    expect(view.header).toEqual({
      live: ui.landing.live,
      player: ui.landing.player,
      playerShort: ui.landing.playerShort,
    });
    expect(view.footer).toEqual([
      {
        label: ui.landing.home,
        value: getPlayerFirstName(content),
        tone: "primary",
        align: "start",
      },
      { label: ui.landing.status, value: ui.landing.undefeated, tone: "volt", align: "center" },
      { label: ui.landing.away, value: ui.landing.you, tone: "label", align: "end" },
    ]);
  });

  it("the calls to action and where they go", () => {
    expect(view.challenge).toBe(ui.landing.challenge);
    expect(view.enter).toEqual({
      label: ui.landing.enter,
      sub: ui.landing.enterSub,
      subPhone: ui.landing.enterSubPhone,
      to: ROUTES.intro,
    });
    expect(view.view).toEqual({
      label: ui.landing.view,
      sub: ui.landing.viewSub,
      to: ROUTES.scout,
    });
    expect(view.skip).toEqual({ label: ui.hud.skipIntro, to: ROUTES.arena });
  });

  it("the hint, the first entrance line, the audio toggle and the brand", () => {
    expect(view.hint).toBe(ui.landing.hint);
    expect(view.comm).toBe(content.commentary.entrance[0]);
    expect(view.audio).toEqual(ui.audio);
    expect(view.audio.labelPhone).toBe("SOUND");
    expect(ui.landing.playerShort).toBe("01 / 01");
    expect(view.brand).toEqual({ mark: ui.brand.mark, label: ui.brand.wordmark });
    expect(view.commTag).toBe(ui.comm.tag);
  });
});
