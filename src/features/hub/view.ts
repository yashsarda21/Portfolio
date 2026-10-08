import type { Content, UiCopy } from "@/content";
import { VENUES, type MatchRecordData, type Venue } from "@/shell/matchRecord";
import type { ROUTES } from "@/shell/routes";

export type HubRecord = Pick<
  MatchRecordData,
  "venuesPlayed" | "lastScores" | "sectionsSeen" | "record" | "achievements" | "lockerRoomUnlocked"
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
  | "lockerRoom";
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
  achievements: { label: string; text: string };
  facilities: HubFacility[];
  facilitiesPhone: HubFacility[];
  comm: string;
  commTag: string;
  hint: string;
  quickView: string;
  drawer: { open: string; close: string };
  audio: UiCopy["audio"];
}

const SCENES = { cricket: "turf", tennis: "court", badminton: "hall" } as const;
const SKIP_TO = { cricket: "career", tennis: "highlights", badminton: "attributes" } as const;
/** The only hidden achievement so far (H8). */
const ACHIEVEMENTS = ["giant-killer"] as const;
/** Index entries in order; each is "seen" with the section whose page it lives on. The Locker Room shows once unlocked. */
const INDEX = [
  { key: "career", seenWith: "career", to: "career" },
  { key: "highlights", seenWith: "highlights", to: "highlights" },
  { key: "attributes", seenWith: "attributes", to: "attributes" },
  { key: "trophies", seenWith: "trophies", to: "trophies" },
  { key: "academy", seenWith: "trophies", to: "trophies" },
  { key: "card", seenWith: "card", to: "card" },
  { key: "teamUp", seenWith: "teamUp", to: "teamUp" },
  { key: "scout", seenWith: "scout", to: "scout" },
  { key: "lockerRoom", seenWith: "lockerRoom", to: "lockerRoom" },
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
      statusPhone: played ? (score ?? hub.venue.played) : copy.duration,
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
      to: key === "academy" ? `${routes[to]}#academy` : routes[to],
    };
  };
  const links = INDEX.filter((e) => e.key !== "lockerRoom" || record.lockerRoomUnlocked).map(link);

  const unlocked = ACHIEVEMENTS.filter((a) => record.achievements.includes(a)).length;
  const a = hub.achievements;
  const comms = [hub.comm.none, hub.comm.one, hub.comm.two, hub.comm.all];

  const f = hub.facilities;
  const trophies: HubFacility = {
    key: "trophies",
    label: f.trophies.label,
    title: f.trophies.title,
    to: routes.trophies,
    tone: "glass",
  };
  const academy: HubFacility = {
    key: "academy",
    label: f.academy.label,
    title: f.academy.title,
    to: `${routes.trophies}#academy`,
    tone: "glass",
  };
  const card: HubFacility = {
    key: "card",
    label: f.card.label,
    title: f.card.title,
    to: routes.card,
    tone: "glass",
  };
  const teamUp: HubFacility = {
    key: "teamUp",
    label: f.teamUp.label,
    title: f.teamUp.title,
    to: routes.teamUp,
    tone: "volt",
  };

  return {
    heading: ui.routes.arena.heading,
    eyebrow: hub.eyebrow,
    hud: hub.hud,
    brand: { mark: ui.brand.mark, label: ui.brand.wordmark, to: routes.home },
    record: {
      label: ui.record.yours,
      value: `${hub.record.yash} ${record.record.yash} ${sep} ${hub.record.you} ${record.record.you}`,
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
    achievements: {
      label: a.label,
      text: `${unlocked} ${a.of} ${ACHIEVEMENTS.length} ${a.unlocked} ${unlocked > 0 ? a.open : a.locked}`,
    },
    facilities: [trophies, academy, card, teamUp],
    facilitiesPhone: [
      { ...trophies, label: f.trophies.labelPhone },
      { ...academy, title: f.academy.titlePhone },
    ],
    comm:
      record.record.you > 0
        ? (content.commentary.visitorWins[0] ?? hub.comm.all)
        : (comms[done] ?? hub.comm.none),
    commTag: ui.comm.tag,
    hint: hub.hint,
    quickView: ui.hud.quickView,
    drawer: { open: hub.drawer.open, close: hub.drawer.close },
    audio: ui.audio,
  };
}
