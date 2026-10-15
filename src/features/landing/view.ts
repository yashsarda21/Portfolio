import type { ScoreboardCell } from "@/design-system";
import { getPlayerFirstName, type Content, type UiCopy } from "@/content";
import type { ROUTES } from "@/shell/routes";

export interface LandingView {
  /** The route's heading ("YASH SARDA"): what screen readers and the tab title call the page. */
  heading: string;
  title: { name: string; role: string };
  brand: { mark: string; label: string };
  header: { live: string; player: string; playerShort: string };
  footer: ScoreboardCell[];
  /** The phone board's two cells (the wide board's HOME is not drawn there). */
  footerPhone: ScoreboardCell[];
  challenge: string;
  enter: { label: string; sub: string; subPhone: string; to: string };
  view: { label: string; sub: string; to: string };
  hint: string;
  /** The first line of the entrance commentary. */
  comm: string;
  commTag: string;
  skip: { label: string; to: string };
  audio: UiCopy["audio"];
}

/** Everything the Landing says, from content and ui copy (the page holds no strings). */
export function buildLandingView(
  content: Content,
  ui: UiCopy,
  routes: Pick<typeof ROUTES, "intro" | "scout" | "arena">,
): LandingView {
  const l = ui.landing;
  return {
    heading: ui.routes.home.heading,
    title: { name: content.player.name, role: content.player.title },
    brand: { mark: ui.brand.mark, label: ui.brand.wordmark },
    header: { live: l.live, player: l.player, playerShort: l.playerShort },
    footer: [
      { label: l.home, value: getPlayerFirstName(content), tone: "primary", align: "start" },
      { label: l.status, value: l.undefeated, tone: "volt", align: "center" },
      { label: l.away, value: l.you, tone: "label", align: "end" },
    ],
    footerPhone: [
      { label: l.status, value: l.undefeated, tone: "volt", align: "start" },
      { label: l.away, value: l.you, tone: "label", align: "end" },
    ],
    challenge: l.challenge,
    enter: { label: l.enter, sub: l.enterSub, subPhone: l.enterSubPhone, to: routes.intro },
    view: { label: l.view, sub: l.viewSub, to: routes.scout },
    hint: l.hint,
    comm: content.commentary.entrance[0]!,
    commTag: ui.comm.tag,
    skip: { label: ui.hud.skipIntro, to: routes.arena },
    audio: ui.audio,
  };
}
