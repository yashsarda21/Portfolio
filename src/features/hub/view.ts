import type { Content, UiCopy } from "@/content";
import { VENUES, matchdayComplete, type MatchRecordData, type Venue } from "@/shell/matchRecord";
import type { ROUTES } from "@/shell/routes";

export type HubRecord = Pick<
  MatchRecordData,
  "venuesPlayed" | "lastScores" | "sectionsSeen" | "yashWins"
>;

export interface HubVenue {
  key: Venue;
  scene: "turf" | "court" | "hall";
  played: boolean;
  /** "VENUE 01" */
  number: string;
  /** Phone: "VENUE 01 · CAREER" */
  meta: string;
  name: string;
  blurb: string;
  reveals: string;
  duration: string;
  /** "PLAYED · 14* NOT OUT" | "PLAYED" | "UNPLAYED" */
  status: string;
  /** "14* NOT OUT" | "PLAYED" | "~12s" */
  statusPhone: string;
  play: { label: string; to: string };
  skip: { label: string; labelPhone: string; to: string };
  /** "1" | "2" | "3" */
  shortcut: string;
}

export type IndexKey =
  | "career"
  | "highlights"
  | "attributes"
  | "trophies"
  | "academy"
  | "card"
  | "teamUp"
  | "scout"
  | "fullTime";
export interface HubIndexLink {
  key: IndexKey;
  label: string;
  tag: string;
  seen: boolean;
  to: string;
}
export interface HubFacility {
  key: "trophies" | "academy" | "card" | "teamUp";
  label: string;
  title: string;
  to: string;
  tone: "glass" | "volt";
}
export interface HubView {
  heading: string;
  eyebrow: string;
  hud: string;
  brand: { mark: string; label: string; to: string };
  record: { label: string; value: string };
  matchday: { label: string; title: string; done: number; total: number; progress: string };
  fixtures: string;
  venues: HubVenue[];
  index: { label: string; title: string; links: HubIndexLink[] };
  /** The rail's bottom box (F8): waits for all three venues, then says the result is up. */
  fullTime: { label: string; text: string };
  facilities: HubFacility[];
  facilitiesPhone: HubFacility[];
  comm: string;
  commTag: string;
  /** The stage's hint, in parts: the page shows only what works for this visitor (`hubHint`). */
  hint: { drag: string; keys: string; sep: string };
  quickView: string;
  drawer: { open: string; close: string };
  audio: UiCopy["audio"];
}

const SCENES = { cricket: "turf", tennis: "court", badminton: "hall" } as const;
const SKIP_TO = { cricket: "career", tennis: "highlights", badminton: "attributes" } as const;
/** The academy is a section of the trophies page. */
const ACADEMY = { route: "trophies", hash: "academy" } as const;
type Target = keyof typeof ROUTES | typeof ACADEMY;
const target = (routes: typeof ROUTES, to: Target) =>
  typeof to === "string" ? routes[to] : `${routes[to.route]}#${to.hash}`;
/** The facilities row, left to right; Team Up is the volt tile. */
const FACILITIES = [
  { key: "trophies", to: "trophies", tone: "glass" },
  { key: "academy", to: ACADEMY, tone: "glass" },
  { key: "card", to: "card", tone: "glass" },
  { key: "teamUp", to: "teamUp", tone: "volt" },
] as const satisfies readonly { key: HubFacility["key"]; to: Target; tone: HubFacility["tone"] }[];
/** Index entries in order; each is "seen" with the section whose page it lives on. */
const INDEX = [
  { key: "career", seenWith: "career", to: "career" },
  { key: "highlights", seenWith: "highlights", to: "highlights" },
  { key: "attributes", seenWith: "attributes", to: "attributes" },
  { key: "trophies", seenWith: "trophies", to: "trophies" },
  { key: "academy", seenWith: "trophies", to: ACADEMY },
  { key: "card", seenWith: "card", to: "card" },
  { key: "teamUp", seenWith: "teamUp", to: "teamUp" },
  { key: "scout", seenWith: "scout", to: "scout" },
  { key: "fullTime", seenWith: "fullTime", to: "fullTime" },
] as const;

/** Everything the Hub shows, as plain words, from the content, the copy and the saved record (H3 to H8). */
export function buildHubView(
  content: Content,
  ui: UiCopy,
  routes: typeof ROUTES,
  record: HubRecord,
): HubView {
  const { hub } = ui;
  const sep = ui.glyph.sep;
  const total = VENUES.length;
  const done = VENUES.filter((v) => record.venuesPlayed.includes(v)).length;

  const venues = VENUES.map((key, i): HubVenue => {
    const copy = hub.venues[key];
    const played = record.venuesPlayed.includes(key);
    const score = record.lastScores[key];
    const number = `${hub.venue.number} 0${i + 1}`;
    return {
      key,
      scene: SCENES[key],
      played,
      number,
      meta: `${number} ${sep} ${copy.category}`,
      name: ui.venues[key],
      blurb: copy.blurb,
      reveals: [hub.venue.reveals, copy.reveals, copy.duration].join(` ${sep} `),
      duration: copy.duration,
      status: played
        ? score
          ? `${hub.venue.played} ${sep} ${score}`
          : hub.venue.played
        : hub.venue.unplayed,
      statusPhone: played ? score || hub.venue.played : copy.duration,
      play: { label: played ? ui.hud.rematch : hub.venue.play, to: routes[key] },
      skip: {
        label: hub.venue.skip,
        labelPhone: played ? copy.see : hub.venue.skip,
        to: routes[SKIP_TO[key]],
      },
      shortcut: String(i + 1),
    };
  });

  const link = ({ key, seenWith, to }: (typeof INDEX)[number]): HubIndexLink => {
    const seen = record.sectionsSeen.includes(seenWith);
    const copy = hub.index.links[key];
    return {
      key,
      label: copy.label,
      tag: seen ? hub.index.seen : copy.tag,
      seen,
      to: target(routes, to),
    };
  };
  // Full Time is listed once the matchday is complete (F8).
  const complete = matchdayComplete(record);
  const links = INDEX.filter(({ key }) => key !== "fullTime" || complete).map(link);

  const comms = [hub.comm.none, hub.comm.one, hub.comm.two, hub.comm.all];

  const f = hub.facilities;
  const facilities = FACILITIES.map(({ key, to, tone }): HubFacility => ({
    key,
    label: f[key].label,
    title: f[key].title,
    to: target(routes, to),
    tone,
  }));
  const [trophies, academy] = facilities as [HubFacility, HubFacility];

  return {
    heading: ui.routes.arena.heading,
    eyebrow: hub.eyebrow,
    hud: hub.hud,
    brand: { mark: ui.brand.mark, label: ui.brand.wordmark, to: routes.home },
    record: {
      label: ui.record.yours,
      value: `${hub.record.yash} ${record.yashWins} ${sep} ${hub.record.you} 0`,
    },
    matchday: {
      label: hub.matchday.label,
      title: `${done} ${hub.matchday.of} ${total} ${hub.matchday.venues}`,
      done,
      total,
      progress: `${done} ${hub.matchday.progress.of} ${total} ${hub.matchday.progress.tail}`,
    },
    fixtures: `${hub.matchday.fixtures} ${sep} ${done} ${hub.matchday.of} ${total} ${hub.matchday.played}`,
    venues,
    index: { label: hub.index.label, title: hub.index.title, links },
    fullTime: {
      label: hub.fullTime.label,
      text: complete ? hub.fullTime.done : hub.fullTime.pending,
    },
    facilities,
    facilitiesPhone: [
      { ...trophies, label: f.trophies.labelPhone },
      { ...academy, title: f.academy.titlePhone },
    ],
    comm: comms[done] ?? hub.comm.none,
    commTag: ui.comm.tag,
    hint: { drag: hub.hint.drag, keys: hub.hint.keys, sep },
    quickView: ui.hud.quickView,
    drawer: { open: hub.drawer.open, close: hub.drawer.close },
    audio: ui.audio,
  };
}

/**
 * The hint for what this visitor can do: dragging needs motion (off under reduced motion); the number keys need a
 * keyboard (a touch-only screen has none). Both when nothing is known yet, so the prerender is the artboard's line.
 * Empty when neither works.
 */
export function hubHint(
  hint: HubView["hint"],
  { reducedMotion, touchOnly }: { reducedMotion: boolean; touchOnly: boolean },
): string {
  const parts = [];
  if (!reducedMotion) parts.push(hint.drag);
  if (!touchOnly) parts.push(hint.keys);
  return parts.join(` ${hint.sep} `);
}
