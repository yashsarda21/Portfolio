import type { Content, UiCopy } from "@/content";
import type { ROUTES } from "@/shell/routes";

/** One piece of the tagline: a word, or the volt bullet between two words. */
export interface TaglinePart {
  kind: "word" | "sep";
  text: string;
  tone: "primary" | "secondary" | "volt";
}

export interface IntroFooterCell {
  label: string;
  value: string;
  tone: "primary" | "volt" | "label";
  align: "start" | "center" | "end";
}

export interface IntroView {
  /** The name: the page's <h1> carries it as its accessible name (its letters are decorative). */
  heading: string;
  name: string;
  title: string;
  portraitAlt: string;
  brand: { mark: string };
  /** `count` is the phone board's right-hand cell ("01 / 01"); the wide board shows `matchday` instead. */
  header: { live: string; matchday: string; count: string };
  tagline: TaglinePart[];
  footer: IntroFooterCell[];
  /** The phone board's two cells: the wide board's INTRODUCING cell is not drawn there. */
  footerPhone: IntroFooterCell[];
  welcome: string;
  enter: { label: string; to: string };
  skip: { label: string; to: string };
  replay: string;
  /** The first line of the intro commentary, said at the commentary beat. */
  comm: string;
  commTag: string;
}

/** Everything the Player Introduction says, from content and ui copy (the page holds no strings). */
export function buildIntroView(
  content: Content,
  ui: UiCopy,
  routes: Pick<typeof ROUTES, "arena">,
): IntroView {
  const i = ui.intro;
  const tagline = i.tagline.flatMap<TaglinePart>((text, n) => {
    const word: TaglinePart = { kind: "word", text, tone: n === 0 ? "primary" : "secondary" };
    return n === 0 ? [word] : [{ kind: "sep", text: ui.glyph.bullet, tone: "volt" }, word];
  });
  return {
    heading: content.player.name,
    name: content.player.name,
    title: content.player.title,
    portraitAlt: i.portraitAlt,
    brand: { mark: ui.brand.mark },
    header: { live: i.live, matchday: i.matchday, count: ui.landing.playerShort },
    tagline,
    footer: [
      { label: i.introducing, value: i.number, tone: "primary", align: "start" },
      { label: ui.record.label, value: ui.record.value, tone: "primary", align: "center" },
      { label: ui.landing.status, value: ui.landing.undefeated, tone: "volt", align: "end" },
    ],
    footerPhone: [
      { label: ui.record.label, value: ui.record.value, tone: "primary", align: "start" },
      { label: ui.landing.status, value: ui.landing.undefeated, tone: "volt", align: "end" },
    ],
    welcome: i.welcome,
    enter: { label: `${i.enter} ${ui.glyph.next}`, to: routes.arena },
    skip: { label: ui.hud.skipIntro, to: routes.arena },
    replay: ui.hud.replay,
    comm: content.commentary.intro[0]!,
    commTag: ui.comm.tag,
  };
}
