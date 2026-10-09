import { getHighlights, type Content, type UiCopy } from "@/content";
import type { ROUTES } from "@/shell/routes";
import { buildGameChrome, type GameChrome } from "../frame/chrome";
import {
  SERVE_KMH,
  TENNIS_SERVES,
  tennisOver,
  tennisPoints,
  type Side,
  type TennisState,
} from "./referee";

/**
 * Where the game is: waiting to serve, the tell (the open side lit), Yash's toss, the window to return in, the call,
 * the 2 s verdict, the end buttons.
 */
export type TennisPhase = "ready" | "tell" | "toss" | "window" | "called" | "verdict" | "end";

/** What `AimZone` takes, plus the side it stands for. */
export interface TennisAim {
  side: Side;
  label: string;
  /** The accessible name: "Return to the right — open court". */
  name: string;
  open: boolean;
}

/** A courtside highlight card: what `CourtsideCard` takes. */
export interface TennisCard {
  side: Side;
  eyebrow: string;
  tag: string;
  media: string;
  title: string;
  line: string;
}

type Bar = "done" | "current" | "todo";
type Link = { label: string; to: string };

export interface TennisView {
  chrome: GameChrome;
  bug: {
    /** The group's accessible name. */
    label: string;
    name: string;
    /** Yash's points: "40". */
    yash: string;
    /** Your points: "30". */
    you: string;
    away: string;
    /** "RALLY 3" | "GAME YASH" | "BROKE SERVE" */
    status: string;
    /** The phone's meta: "RALLY 3/3" | "GAME YASH" | "BROKE SERVE" */
    statusPhone: string;
    /** The status is drawn as an alert once you have broken serve. */
    alert: boolean;
  };
  /** "YASH · SERVING · 194 KM/H" */
  serving: string;
  /** How many returns have been played (0 to 3): a new call, a new card. */
  returned: number;
  /** The left zone, then the right. */
  aims: [TennisAim, TennisAim];
  /** The courtside cards so far, in the order they were unlocked. */
  cards: TennisCard[];
  /** The newest card as the phone's chip: null before the first return. */
  latest: { eyebrow: string; title: string; meta: string } | null;
  progress: { label: string; bars: [Bar, Bar, Bar] };
  /** The far LED board. */
  marquee: { text: string; tone: "volt" | "floodlight" }[];
  instructions: { title: string; how: string; keys: string; tap: string; phoneHint: string };
  /** The big call for the last return: only while it is being called. */
  call: { text: string; tone: "volt" | "floodlight" } | null;
  /** The commentary line for the last return; the arrival line before the first. */
  comm: string;
  /** What a screen reader hears of the last return: the call and what it unlocked. "" before return 1. */
  announce: string;
  /** What the end offers; null while the game is still being played. */
  end: { primary: Link | null; claim?: Link; again?: string } | null;
  /** The result saved to the match record and shown on the Hub: "GAME YASH" | "BROKE SERVE". */
  saved: string;
  heading: string;
}

/** The route the claim goes to. */
const CLAIM_TO = "giantKiller" as const;
/** The calls that go your way. */
const FOR_YOU = new Set(["clean", "returned", "winner"]);
/** The phases in which a serve is in play: the open side is lit and a side can be picked (before the hit it is TOO EARLY). */
export const LIVE_PHASES: readonly TennisPhase[] = ["tell", "toss", "window"];

/** "HIGHLIGHT" → "Highlight": the screen-reader sentence reads the copy in sentence case. */
const sentence = (word: string) => word.charAt(0) + word.slice(1).toLowerCase();
const two = (n: number) => String(n).padStart(2, "0");

/** Everything the tennis game shows, as plain words, from the content, the copy and the game so far (G5, G7, G8). */
export function buildTennisView(
  content: Content,
  ui: UiCopy,
  routes: typeof ROUTES,
  state: TennisState,
  { phase, offerHighlight }: { phase: TennisPhase; offerHighlight: boolean },
): TennisView {
  const copy = ui.games.tennis;
  const sep = ui.glyph.sep;
  const chrome = buildGameChrome(ui, routes, "tennis");
  const played = state.returns.length;
  const over = tennisOver(state);
  const [yash, you] = tennisPoints(state);
  const rally = Math.min(played + 1, TENNIS_SERVES);

  // G7: the projects in round order, one per return, however many the content grows to.
  const highlights = getHighlights(content).slice(0, TENNIS_SERVES);
  const cards = highlights.slice(0, played).map((h, i): TennisCard => ({
    side: i % 2 === 0 ? "left" : "right",
    eyebrow: `${copy.highlight} ${two(i + 1)} ${sep} ${h.roundShort}`,
    tag: `${ui.games.rally} ${i + 1}`,
    media: copy.recording,
    title: h.name.toUpperCase(),
    line: h.line,
  }));
  const newest = cards.at(-1);
  const last = state.returns.at(-1);
  const next = highlights[played];

  const open = LIVE_PHASES.includes(phase) ? state.serve?.open : undefined;
  const aim = (side: Side): TennisAim => {
    const lit = open === side;
    const words = lit ? copy.aim.open : copy.aim[side];
    return {
      side,
      label: side === "left" ? `${ui.glyph.prev} ${words}` : `${words} ${ui.glyph.next}`,
      name: lit ? `${copy.aim.to[side]} ${copy.aim.dash} ${copy.aim.openName}` : copy.aim.to[side],
      open: lit,
    };
  };

  const won = state.won;
  const status = won ? copy.status.broke : copy.status.game;
  const calling = phase === "called" || phase === "verdict" || phase === "end";
  const loss = offerHighlight
    ? { label: ui.games.highlight, to: chrome.content }
    : { label: copy.see, to: chrome.content };

  const comm = !last
    ? content.commentary.entrance[0]!
    : last.call === "winner"
      ? content.commentary.visitorWins[0]!
      : last.call === "line"
        ? copy.comm.line
        : last.q === "miss"
          ? copy.comm.missed
          : copy.comm.shipped;

  const marqueeNext =
    played >= TENNIS_SERVES
      ? copy.marquee.allIn
      : played === TENNIS_SERVES - 1
        ? `${copy.marquee.matchPoint} ${sep} ${next?.round} ${copy.marquee.isNext}`
        : `${next?.round} ${copy.marquee.isNext}`;

  return {
    chrome,
    bug: {
      label: ui.games.bug,
      name: ui.hub.record.yash,
      yash,
      you,
      away: ui.hub.record.you,
      status: over ? status : `${ui.games.rally} ${rally}`,
      statusPhone: over ? status : `${ui.games.rally} ${rally}/${TENNIS_SERVES}`,
      alert: over && won,
    },
    serving: [
      ui.hub.record.yash,
      copy.serving,
      `${SERVE_KMH[Math.min(played, SERVE_KMH.length - 1)]} ${copy.kmh}`,
    ].join(` ${sep} `),
    returned: played,
    aims: [aim("left"), aim("right")],
    cards,
    latest: newest
      ? {
          eyebrow: `${newest.eyebrow} ${ui.games.unlocked}`,
          title: newest.title,
          meta: newest.line,
        }
      : null,
    progress: {
      label: copy.progress,
      bars: [0, 1, 2].map((i): Bar =>
        i < played ? "done" : i === played ? "current" : "todo",
      ) as [Bar, Bar, Bar],
    },
    marquee: [
      {
        text: `${copy.marquee.highlights} ${sep} ${played} / ${TENNIS_SERVES} ${ui.games.unlocked}`,
        tone: "volt" as const,
      },
      ...(played > 0 ? [{ text: copy.marquee.shipped, tone: "floodlight" as const }] : []),
      { text: marqueeNext, tone: "volt" as const },
      { text: ui.venues.tennis, tone: "floodlight" as const },
    ],
    instructions: {
      title: chrome.heading,
      how: copy.how,
      keys: copy.keys,
      tap: copy.tap,
      phoneHint: copy.phoneHint,
    },
    call:
      calling && last
        ? { text: copy.calls[last.call], tone: FOR_YOU.has(last.call) ? "volt" : "floodlight" }
        : null,
    comm,
    announce:
      last && newest
        ? `${copy.calls[last.call]} ${sentence(copy.highlight)} ${two(played)} ${ui.games.unlocked.toLowerCase()}: ${newest.title}, ${newest.line}`
        : "",
    end: !over
      ? null
      : won
        ? { primary: null, claim: { label: copy.claim, to: routes[CLAIM_TO] } }
        : { primary: loss, again: ui.hud.rematch },
    saved: status,
    heading: chrome.heading,
  };
}
