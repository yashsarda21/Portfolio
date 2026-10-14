import type { UiCopy } from "@/content";
import type { Venue } from "@/shell/matchRecord";
import type { ROUTES } from "@/shell/routes";

export interface GameChrome {
  /** The HUD's breadcrumb: "HUB / CRICKET GROUND", the brand going back to the Hub. */
  breadcrumb: { mark: string; hubLabel: string; label: string; trail: string[]; to: string };
  /** "SKIP TO CAREER STATS": always on screen. `short` is the word the phone's chip draws. */
  skip: { label: string; short: string; to: string };
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
      hubLabel: ui.games.hubLabel,
      label: ui.pages.breadcrumb,
      trail: [ui.venues[venue]],
      to: routes.arena,
    },
    skip: { label: ui.games[venue].skip, short: ui.games.skipShort, to },
    content: to,
    commTag: ui.comm.tag,
    audio: ui.audio,
    heading: ui.routes[venue].heading,
  };
}

type Link = { label: string; to: string };

/** What a game offers when it is over: `GameEnd` draws it as it is. */
export interface GameEndView {
  /** SEE FULL TIME once all three venues are played (F3); else the venue's page, or after the second loss the highlight (G9). */
  primary: Link;
  /** Play again. */
  again: string;
  /** Back to the Hub: the phone's column draws it as a quiet third link (the stage has the breadcrumb). */
  hub: Link;
}

/** "ATTRIBUTE CHARGED" becomes "Attribute charged": the screen-reader sentence reads the copy in sentence case. */
export const sentenceCase = (text: string) => text.charAt(0) + text.slice(1).toLowerCase();

/** What a screen reader hears: the last call and its reveal, then, once the game is over, how it ended. */
export const announceWith = (line: string, outcome: string | null) =>
  outcome ? `${line}. ${outcome}.` : line;

/**
 * The end of a game, the same in all three: nothing while it is on; then play again and a main button: SEE FULL
 * TIME once the matchday is complete (F3), else the venue's page (`see`), or the highlight once `offerHighlight` (G9).
 */
export function buildGameEnd(
  ui: UiCopy,
  routes: typeof ROUTES,
  chrome: GameChrome,
  {
    over,
    offerHighlight,
    fullTime,
    see,
    again,
  }: { over: boolean; offerHighlight: boolean; fullTime: boolean; see: string; again: string },
): GameEndView | null {
  if (!over) return null;
  return {
    primary: fullTime
      ? { label: ui.games.fullTime, to: routes.fullTime }
      : { label: offerHighlight ? ui.games.highlight : see, to: chrome.content },
    again,
    hub: { label: ui.games.backToHub, to: routes.arena },
  };
}
