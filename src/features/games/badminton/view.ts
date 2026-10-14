import { getAttributeGroups, type Content, type UiCopy } from "@/content";
import type { AttributeToastProps } from "@/design-system";
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
  badmintonOver,
  badmintonScore,
  BADMINTON_RALLIES,
  DROP_BELOW,
  matchPoint,
  SMASH_FROM,
  type BadmintonState,
} from "./referee";

/** Where the game is: waiting for a hold, the hold, the shuttle in the air, the call, the 2 s verdict, the end buttons. */
export type BadmintonPhase = "ready" | "charging" | "flight" | "called" | "verdict" | "end";

type Tone = "volt" | "floodlight";

export interface BadmintonView {
  chrome: GameChrome;
  bug: {
    /** The group's accessible name. */
    label: string;
    name: string;
    /** Yash's points: "20". */
    yash: string;
    /** Your points: "19". */
    you: string;
    away: string;
    /** "RALLY 2" | "MATCH POINT" | "GAME YASH" */
    status: string;
    /** The phone's: "RALLY 2/4" | "MATCH POINT" | "GAME YASH" */
    statusPhone: string;
    /** The phone draws match point and the end as the status badge, and the other rallies as its quiet meta. */
    phoneBadge: boolean;
    /** Drawn as an alert at match point (A4). */
    alert: boolean;
  };
  /** The power meter's zones (in power %, from the bottom, as the referee counts) and its legend. */
  meter: {
    /** "SHOT POWER" */
    label: string;
    zones: { smashFrom: number; dividerAt: number };
    legend: { name: string; note: readonly string[]; tone: "volt" | "floodlight" | "scout" }[];
  };
  hold: { label: string; phoneHint: string };
  /** "YASH · READING YOUR GRIP" */
  reading: string;
  /** One per rally: the groups charged so far, the next one, and those after it. */
  toasts: AttributeToastProps[];
  /** The newest charge as the phone's chip: null before the first rally. */
  latest: { eyebrow: string; title: string; meta: string } | null;
  /** How many rallies have been played (0 to 4): a new call, a new charge. */
  played: number;
  /** The big call for the last rally: only while it is being called. */
  call: { text: string; tone: Tone } | null;
  /** The commentary line for the last rally; the arrival line before the first. */
  comm: string;
  /** What a screen reader hears of the last rally: the call and what it charged. "" before rally 1. */
  announce: string;
  /** What the end offers; null while the game is still being played. */
  end: GameEndView | null;
  /** The result saved to the match record and shown on the Hub: "21–19". */
  saved: string;
  heading: string;
}

/** The calls that go your way. */
const FOR_YOU = new Set(["perfect"]);

/** Everything the badminton game shows, as plain words, from the content, the copy and the game so far (G6, G7, G8). */
export function buildBadmintonView(
  content: Content,
  ui: UiCopy,
  routes: typeof ROUTES,
  state: BadmintonState,
  { phase, offerHighlight, fullTime }: { phase: BadmintonPhase } & EndFlags,
): BadmintonView {
  const copy = ui.games.badminton;
  const sep = ui.glyph.sep;
  const chrome = buildGameChrome(ui, routes, "badminton");
  const played = state.rallies.length;
  const over = badmintonOver(state);
  const score = badmintonScore(state);
  const rally = Math.min(played + 1, BADMINTON_RALLIES);
  const rallyName = (n: number) => `${ui.games.rally} ${n}`;

  // G7: the groups in content order, one per rally, however many the content grows to.
  const groups = getAttributeGroups(content).slice(0, BADMINTON_RALLIES);
  const charged = groups.slice(0, played).map((g, i) => ({
    eyebrow: `${copy.charged} ${sep} ${rallyName(i + 1)}`,
    tag: g.shot.toUpperCase(),
    title: g.name.toUpperCase(),
    chips: g.skills.filter((s) => s.level === "shipped").map((s) => s.name),
  }));
  // Never LOCKED (§11.2 #24): the next group is UP NEXT, the others just name their rally.
  const toasts: AttributeToastProps[] = groups.map((g, i) =>
    i < played
      ? { state: "charged", ...charged[i]!, accent: i === played - 1 }
      : {
          state: i === played ? "next" : "later",
          label: g.name.toUpperCase(),
          hint: i === played ? `${copy.upNext} ${sep} ${rallyName(i + 1)}` : rallyName(i + 1),
        },
  );
  const newest = charged.at(-1);
  const last = state.rallies.at(-1);

  const status = over ? copy.status.game : null;
  const atMatchPoint = !over && matchPoint(state);
  const calling = phase === "called" || phase === "verdict" || phase === "end";

  const comm = over
    ? content.commentary.yashWins[0]!
    : !last
      ? copy.comm.start
      : atMatchPoint
        ? copy.comm.matchPoint
        : last.call === "perfect"
          ? copy.comm.perfect
          : copy.comm.rally;

  return {
    chrome,
    bug: {
      label: ui.games.bug,
      name: ui.hub.record.yash,
      yash: String(score.yash),
      you: String(score.you),
      away: ui.hub.record.you,
      status: status ?? (atMatchPoint ? copy.matchPoint : rallyName(rally)),
      statusPhone:
        status ?? (atMatchPoint ? copy.matchPoint : `${rallyName(rally)}/${BADMINTON_RALLIES}`),
      phoneBadge: over || atMatchPoint,
      alert: atMatchPoint,
    },
    meter: {
      label: copy.power,
      zones: { smashFrom: SMASH_FROM, dividerAt: DROP_BELOW },
      legend: [
        { name: copy.shots.smash.name, note: copy.shots.smash.note, tone: "volt" },
        { name: copy.shots.clear.name, note: copy.shots.clear.note, tone: "floodlight" },
        { name: copy.shots.drop.name, note: copy.shots.drop.note, tone: "scout" },
      ],
    },
    hold: { label: copy.hold, phoneHint: copy.phoneHint },
    reading: [ui.hub.record.yash, copy.reading].join(` ${sep} `),
    toasts,
    latest: newest
      ? {
          eyebrow: newest.eyebrow,
          title: newest.title,
          meta: newest.chips.join(` ${sep} `),
        }
      : null,
    played,
    call:
      calling && last
        ? { text: copy.calls[last.call], tone: FOR_YOU.has(last.call) ? "volt" : "floodlight" }
        : null,
    comm,
    announce:
      last && newest
        ? announceWith(
            `${copy.calls[last.call]} ${sentenceCase(copy.charged)}, ${rallyName(played).toLowerCase()}: ${newest.title}, ${newest.chips.join(", ")}`,
            // "Game yash. 21–19."
            status ? `${sentenceCase(status)}. ${score.yash}–${score.you}` : null,
          )
        : "",
    end: buildGameEnd(ui, routes, chrome, {
      over,
      offerHighlight,
      fullTime,
      see: copy.see,
      again: ui.hud.rematch,
    }),
    saved: `${score.yash}–${score.you}`,
    heading: chrome.heading,
  };
}
