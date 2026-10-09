import type { UiCopy } from "@/content";
import type { Venue } from "@/shell/matchRecord";
import type { ROUTES } from "@/shell/routes";

export interface GameChrome {
  /** The HUD's breadcrumb: "HUB / CRICKET GROUND", the brand going back to the Hub. */
  breadcrumb: { mark: string; hubLabel: string; label: string; trail: string[]; to: string };
  /** "SKIP TO CAREER STATS": always on screen. */
  skip: { label: string; to: string };
  /** The venue's page (career / highlights / attributes): where the end's main button goes. */
  content: string;
  commTag: string;
  audio: UiCopy["audio"];
  /** The game's `h1`. */
  heading: string;
}

const PAGE = { cricket: "career", tennis: "highlights", badminton: "attributes" } as const;

/** What the three games share around their play: the breadcrumb, SKIP, the venue's page and the h1, from the copy and the routes. */
export function buildGameChrome(ui: UiCopy, routes: typeof ROUTES, venue: Venue): GameChrome {
  const to = routes[PAGE[venue]];
  return {
    breadcrumb: {
      mark: ui.brand.mark,
      hubLabel: ui.placeholder.hub,
      label: ui.pages.breadcrumb,
      trail: [ui.venues[venue]],
      to: routes.arena,
    },
    skip: { label: ui.games[venue].skip, to },
    content: to,
    commTag: ui.comm.tag,
    audio: ui.audio,
    heading: ui.routes[venue].heading,
  };
}
