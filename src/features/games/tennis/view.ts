import { getHighlights, type Content, type UiCopy } from "@/content";
import type { ROUTES } from "@/shell/routes";
import type { EndFlags } from "../engine/useMatchResult";
import {
  buildGameChrome,
  announceWith,
  buildGameEnd,
  sentenceCase,
  type GameChrome,
  type GameEndView,
} from "../frame/chrome";
import {
  GAME_AT,
  matchOver,
  scoreOf,
  serveKmh,
  unlockedOf,
  yashPoints,
  type MatchState,
} from "./3d/match";
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

/**
 * Where the 3D game is: waiting to start, Yash's toss, the window to pick in, your swing, the rally ball, the call,
 * the 2 s verdict, the end buttons.
 */
export type Tennis3dPhase =
  "ready" | "toss" | "window" | "struck" | "rally" | "called" | "verdict" | "end";

/** What `AimZone` takes, plus the side it stands for. */
export interface TennisAim {
  side: Side;
  label: string;
  /** The accessible name: "Return to the right — open court". */
  name: string;
  open: boolean;
  /** The arrow on the phone's button for this side. */
  arrow: string;
}

/** A courtside highlight card: what `CourtsideCard` takes. */
export interface TennisCard {
  side: Side;
  eyebrow: string;
  tag: string;
  media: string;
  title: string;
  line: string;
  /** A newer card has taken this side's place on the court: this one stands in the free space above it. */
  moved: boolean;
}

type Bar = "done" | "current" | "todo";

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
    /** "RALLY 3" | "GAME YASH" */
    status: string;
    /** The phone's meta: "RALLY 3/3" | "GAME YASH" */
    statusPhone: string;
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
  end: GameEndView | null;
  /** The result saved to the match record and shown on the Hub: "GAME YASH". */
  saved: string;
  heading: string;
}

/** The calls that go your way. */
const FOR_YOU = new Set(["clean", "returned"]);
/** The phases in which a serve is in play: the open side is lit and a side can be picked (before the hit it is TOO EARLY). */
export const LIVE_PHASES: readonly TennisPhase[] = ["tell", "toss", "window"];

/** The phases of the 3D game in which a window is open or about to be: a side can be picked (before the hit it is TOO EARLY). */
export const LIVE_3D: readonly Tennis3dPhase[] = ["toss", "window", "rally"];

const two = (n: number) => String(n).padStart(2, "0");

/** The first `n` projects as courtside cards, in the order they were unlocked; `tagFor(i)` is card i's tag. */
function highlightCards(
  content: Content,
  ui: UiCopy,
  n: number,
  tagFor: (i: number) => string,
): TennisCard[] {
  const copy = ui.games.tennis;
  const sep = ui.glyph.sep;
  const sideOf = (i: number): Side => (i % 2 === 0 ? "left" : "right");
  return getHighlights(content)
    .slice(0, TENNIS_SERVES)
    .slice(0, n)
    .map((h, i): TennisCard => ({
      side: sideOf(i),
      // The third card comes to the left again: the one it replaces there makes room, so every project stays on screen.
      moved: i + 2 < n && sideOf(i + 2) === sideOf(i),
      eyebrow: `${copy.highlight} ${two(i + 1)} ${sep} ${h.roundShort}`,
      tag: tagFor(i),
      media: copy.recording,
      title: h.name.toUpperCase(),
      line: h.line,
    }));
}

/** The two aim zones, the left then the right; `open` (if any) is lit. */
function aimsFor(ui: UiCopy, open: Side | null | undefined): [TennisAim, TennisAim] {
  const copy = ui.games.tennis;
  const aim = (side: Side): TennisAim => {
    const lit = open === side;
    const words = lit ? copy.aim.open : copy.aim[side];
    return {
      side,
      label: side === "left" ? `${ui.glyph.prev} ${words}` : `${words} ${ui.glyph.next}`,
      name: lit ? `${copy.aim.to[side]} ${copy.aim.dash} ${copy.aim.openName}` : copy.aim.to[side],
      open: lit,
      arrow: side === "left" ? ui.glyph.prev : ui.glyph.next,
    };
  };
  return [aim("left"), aim("right")];
}

/** The far LED board for `n` unlocked projects; `matchPoint` (2D only) adds "MATCH POINT" to the next line. */
function marqueeFor(
  ui: UiCopy,
  highlights: ReturnType<typeof getHighlights>,
  n: number,
  matchPoint: boolean,
): TennisView["marquee"] {
  const copy = ui.games.tennis;
  const sep = ui.glyph.sep;
  const next = highlights[n];
  const marqueeNext =
    n >= TENNIS_SERVES
      ? copy.marquee.allIn
      : matchPoint
        ? `${copy.marquee.matchPoint} ${sep} ${next?.round} ${copy.marquee.isNext}`
        : `${next?.round} ${copy.marquee.isNext}`;
  return [
    {
      text: `${copy.marquee.highlights} ${sep} ${n} / ${TENNIS_SERVES} ${ui.games.unlocked}`,
      tone: "volt" as const,
    },
    ...(n > 0 ? [{ text: copy.marquee.shipped, tone: "floodlight" as const }] : []),
    { text: marqueeNext, tone: "volt" as const },
    { text: ui.venues.tennis, tone: "floodlight" as const },
  ];
}

/** The progress bars for `n` unlocked projects: done, then the current one, then the rest. */
const barsFor = (n: number) =>
  [0, 1, 2].map((i): Bar => (i < n ? "done" : i === n ? "current" : "todo")) as [Bar, Bar, Bar];

/** Everything the tennis game shows, as plain words, from the content, the copy and the game so far (G5, G7, G8). */
export function buildTennisView(
  content: Content,
  ui: UiCopy,
  routes: typeof ROUTES,
  state: TennisState,
  { phase, offerHighlight, fullTime }: { phase: TennisPhase } & EndFlags,
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
  const cards = highlightCards(content, ui, played, (i) => `${ui.games.rally} ${i + 1}`);
  const newest = cards.at(-1);
  const last = state.returns.at(-1);

  const open = LIVE_PHASES.includes(phase) ? state.serve?.open : undefined;
  const status = copy.status.game;
  const calling = phase === "called" || phase === "verdict" || phase === "end";

  const comm = !last
    ? content.commentary.entrance[0]!
    : last.call === "line"
      ? copy.comm.line
      : last.q === "miss"
        ? copy.comm.missed
        : copy.comm.shipped;

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
    },
    serving: [
      ui.hub.record.yash,
      copy.serving,
      `${SERVE_KMH[Math.min(played, SERVE_KMH.length - 1)]} ${ui.games.kmh}`,
    ].join(` ${sep} `),
    returned: played,
    aims: aimsFor(ui, open),
    cards,
    latest: newest
      ? {
          eyebrow: `${newest.eyebrow} ${ui.games.unlocked}`,
          title: newest.title,
          meta: newest.line,
        }
      : null,
    progress: { label: copy.progress, bars: barsFor(played) },
    marquee: marqueeFor(ui, highlights, played, played === TENNIS_SERVES - 1),
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
        ? announceWith(
            `${copy.calls[last.call]} ${sentenceCase(copy.highlight)} ${two(played)} ${ui.games.unlocked.toLowerCase()}: ${newest.title}, ${newest.line}`,
            over ? sentenceCase(status) : null,
          )
        : "",
    end: buildGameEnd(ui, routes, chrome, {
      over,
      offerHighlight,
      fullTime,
      see: copy.see,
      again: ui.hud.rematch,
    }),
    saved: status,
    heading: chrome.heading,
  };
}

/** Everything the 3D tennis game shows: real points to 40 (Phase 8), the same board, cards and calls as the 2D game. */
export function buildTennis3dView(
  content: Content,
  ui: UiCopy,
  routes: typeof ROUTES,
  state: MatchState,
  { phase, open, offerHighlight, fullTime }: { phase: Tennis3dPhase; open: Side | null } & EndFlags,
): TennisView {
  const copy = ui.games.tennis;
  const three = copy.three;
  const sep = ui.glyph.sep;
  const chrome = buildGameChrome(ui, routes, "tennis");
  const played = state.points.length;
  const over = matchOver(state);
  const [yash, you] = scoreOf(state);
  const unlocked = unlockedOf(state);
  const status = copy.status.game;
  const boardStatus = over
    ? status
    : yashPoints(state) === GAME_AT - 1
      ? three.gamePoint
      : `${three.point} ${played + 1}`;

  // Card i was unlocked by Yash's (i + 1)th point: its tag names that point (1-based, among all the points played).
  const unlockedBy = state.points.flatMap((p, i) => (p.winner === "yash" ? [i + 1] : []));
  const cards = highlightCards(content, ui, unlocked, (i) => `${three.point} ${unlockedBy[i]}`);
  const newest = cards.at(-1);
  const last = state.points.at(-1);
  const calling = phase === "called" || phase === "verdict" || phase === "end";
  const score = `${yash}–${you}`;

  const comm = !last
    ? content.commentary.entrance[0]!
    : over
      ? three.comm.game
      : last.call === "out"
        ? three.comm.out
        : last.winner === "you"
          ? three.comm.yourPoint
          : yashPoints(state) === GAME_AT - 1
            ? three.comm.gamePoint
            : last.call === "ace"
              ? copy.comm.missed
              : copy.comm.shipped;

  // The call's words: the 2D game's for ace / early / wrong, the 3D game's for the rest.
  const callText = last ? { ...copy.calls, ...three.calls }[last.call] : "";
  // Yash's point only unlocks a card while there are cards left (his fourth is the game).
  const unlock = last?.winner === "yash" && !over && newest ? newest : null;
  const spoken = `${callText} ${score}.`;

  return {
    chrome,
    bug: {
      label: ui.games.bug,
      name: ui.hub.record.yash,
      yash,
      you,
      away: ui.hub.record.you,
      status: boardStatus,
      statusPhone: boardStatus,
    },
    serving: [ui.hub.record.yash, copy.serving, `${serveKmh(state)} ${ui.games.kmh}`].join(
      ` ${sep} `,
    ),
    returned: played,
    aims: aimsFor(ui, phase === "window" ? open : null),
    cards,
    latest: newest
      ? {
          eyebrow: `${newest.eyebrow} ${ui.games.unlocked}`,
          title: newest.title,
          meta: newest.line,
        }
      : null,
    progress: { label: three.progress, bars: barsFor(unlocked) },
    marquee: marqueeFor(ui, getHighlights(content).slice(0, TENNIS_SERVES), unlocked, false),
    instructions: {
      title: chrome.heading,
      how: three.how,
      keys: copy.keys,
      tap: copy.tap,
      phoneHint: copy.phoneHint,
    },
    call:
      calling && last
        ? { text: callText, tone: last.call === "winner" ? "volt" : "floodlight" }
        : null,
    comm,
    announce: last
      ? announceWith(
          // The line already ends with its own full stop: when the game is over, announceWith adds the outcome after it.
          unlock
            ? `${spoken} ${sentenceCase(copy.highlight)} ${two(unlocked)} ${ui.games.unlocked.toLowerCase()}: ${unlock.title}, ${unlock.line}`
            : over
              ? spoken.slice(0, -1)
              : spoken,
          over ? sentenceCase(status) : null,
        )
      : "",
    end: buildGameEnd(ui, routes, chrome, {
      over,
      offerHighlight,
      fullTime,
      see: copy.see,
      again: ui.hud.rematch,
    }),
    saved: status,
    heading: chrome.heading,
  };
}
