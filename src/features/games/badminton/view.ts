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
import { matchOver, scoreOf, smashKmh, type Dir, type MatchState } from "./3d/match";
import {
  BADMINTON_START_STATE,
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

/**
 * Where the 3D game is: waiting to start, Yash's serve, the window to pick in, your swing, the rally shuttle, the call,
 * the 2 s verdict, the end buttons.
 */
export type Badminton3dPhase =
  "ready" | "serve" | "window" | "struck" | "rally" | "called" | "verdict" | "end";

/** The phases of the 3D game in which a window is open or about to be: a pick can be made (before the hit it is TOO EARLY). */
export const LIVE_3D: readonly Badminton3dPhase[] = ["serve", "window", "rally"];

/** One of the two pick buttons: what `AimZone` takes, plus the direction it stands for. */
export interface BadmintonAim {
  dir: Dir;
  arrow: "↑" | "↓";
  label: string;
  /** The accessible name: "Send it deep: smash — open court". */
  name: string;
  open: boolean;
}

/** What the 3D game adds to the 2D view: the buttons, the speed line and the hints. */
export interface Badminton3dParts {
  /** The short button (↓ DROP), then the deep one (↑ SMASH). */
  aims: [BadmintonAim, BadmintonAim];
  /** "YASH · SMASH · 348 KM/H": only while a smash win is being called, else null. */
  speed: string | null;
  how: string;
  keys: string;
  hint: { stage: string; phone: string };
  progress: string;
  loading: string;
}

/** The 2D view's shape plus the 3D parts; the 2D's meter, hold and reading are kept, and not drawn in 3D. */
export type Badminton3dView = BadmintonView & { three: Badminton3dParts };

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

const ARROW = { deep: "↑", short: "↓" } as const;

/** The two pick buttons, the short one then the deep one; `open` (if any) is lit. */
function aimsFor(ui: UiCopy, open: Dir | null): [BadmintonAim, BadmintonAim] {
  const aim = ui.games.badminton.three.aim;
  const one = (dir: Dir): BadmintonAim => {
    const lit = open === dir;
    return {
      dir,
      arrow: ARROW[dir],
      label: `${ARROW[dir]} ${lit ? aim.open : aim[dir]}`,
      name: lit ? `${aim.to[dir]} ${aim.dash} ${aim.openName}` : aim.to[dir],
      open: lit,
    };
  };
  return [one("short"), one("deep")];
}

/** Everything the 3D badminton game shows: real rallies to 21 (Phase 8), the same board, cards and end as the 2D game. */
export function buildBadminton3dView(
  content: Content,
  ui: UiCopy,
  routes: typeof ROUTES,
  state: MatchState,
  {
    phase,
    open,
    offerHighlight,
    fullTime,
  }: { phase: Badminton3dPhase; open: Dir | null } & EndFlags,
): Badminton3dView {
  const copy = ui.games.badminton;
  const three = copy.three;
  const tennis = ui.games.tennis.three;
  const sep = ui.glyph.sep;
  // The chrome, the meter, the hold and the reading are the 2D game's, whatever the state.
  const base = buildBadmintonView(content, ui, routes, BADMINTON_START_STATE, {
    phase: "ready",
    offerHighlight,
    fullTime,
  });
  const played = state.rallies.length;
  const over = matchOver(state);
  const { yash, you } = scoreOf(state);
  const score = `${yash}–${you}`;
  const rallyName = (n: number) => `${ui.games.rally} ${n}`;

  // The groups in content order, one per card; card i was charged by the rally that carries it.
  const groups = getAttributeGroups(content).slice(0, BADMINTON_RALLIES);
  const chargedBy = (i: number) => state.rallies.findIndex((r) => r.card === i) + 1;
  const charged = groups.flatMap((g, i) =>
    chargedBy(i) > 0
      ? [
          {
            eyebrow: `${copy.charged} ${sep} ${rallyName(chargedBy(i))}`,
            tag: g.shot.toUpperCase(),
            title: g.name.toUpperCase(),
            chips: g.skills.filter((k) => k.level === "shipped").map((k) => k.name),
          },
        ]
      : [],
  );
  // Never LOCKED (§11.2 #24): the next group is UP NEXT. Rally numbers shift when you win one, so the later ones name their shot.
  const toasts: AttributeToastProps[] = groups.map((g, i) =>
    i < charged.length
      ? { state: "charged", ...charged[i]!, accent: i === charged.length - 1 }
      : {
          state: i === charged.length ? "next" : "later",
          label: g.name.toUpperCase(),
          hint: i === charged.length ? copy.upNext : g.shot.toUpperCase(),
        },
  );
  const newest = charged.at(-1);
  const last = state.rallies.at(-1);
  const lastGroup = last?.card != null ? groups[last.card] : undefined;

  const atAll = !over && yash === 20 && you === 20;
  const yourMatchPoint = !over && you === 20 && yash < 20;
  const atMatchPoint = !over && yash >= 20 && yash > you;
  const status = over
    ? copy.status.game
    : atAll
      ? three.status.all
      : yourMatchPoint
        ? three.status.yourMatchPoint
        : atMatchPoint
          ? copy.matchPoint
          : rallyName(played + 1);
  const calling = phase === "called" || phase === "verdict" || phase === "end";

  const comm = !last
    ? content.commentary.entrance[0]!
    : over
      ? tennis.comm.game
      : last.call === "out"
        ? `${tennis.comm.out} ${lastGroup?.name} ${three.comm.anyway}`
        : last.winner === "you"
          ? atAll
            ? three.comm.all
            : tennis.comm.yourPoint
          : lastGroup
            ? `${three.comm[last.kind]} ${lastGroup.name} ${three.comm.charged}`
            : three.comm[last.kind];

  const callText = last ? three.calls[last.call] : "";
  // Yash's smash win is on the speed gun while it is called; the OUT call is his by a whisker, not a smash.
  const kmh = last && last.winner === "yash" && last.call !== "out" ? smashKmh(last.kind) : null;
  const speed =
    calling && kmh !== null
      ? [ui.hub.record.yash, three.speed, `${kmh} ${ui.games.kmh}`].join(` ${sep} `)
      : null;
  // "Backend charged: Java, Spring Boot, JUnit." Your own rally charges nothing.
  const lastChips = lastGroup
    ? lastGroup.skills.filter((k) => k.level === "shipped").map((k) => k.name)
    : [];
  const spoken = [
    `${callText} ${score}.`,
    lastGroup
      ? `${lastGroup.name} ${three.comm.charged.replace(/\.$/, "")}: ${lastChips.join(", ")}.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    ...base,
    bug: {
      label: ui.games.bug,
      name: ui.hub.record.yash,
      yash: String(yash),
      you: String(you),
      away: ui.hub.record.you,
      status,
      statusPhone: status,
      phoneBadge: over || atMatchPoint || yourMatchPoint || atAll,
      alert: atMatchPoint || yourMatchPoint,
    },
    toasts,
    latest: newest
      ? { eyebrow: newest.eyebrow, title: newest.title, meta: newest.chips.join(` ${sep} `) }
      : null,
    played,
    call:
      calling && last
        ? { text: callText, tone: last.call === "winner" ? "volt" : "floodlight" }
        : null,
    comm,
    announce: last
      ? announceWith(
          // The line already ends with its own full stop: when the game is over, announceWith adds the outcome after it.
          over ? spoken.slice(0, -1) : spoken,
          over ? `${sentenceCase(status)}. ${score}` : null,
        )
      : "",
    end: buildGameEnd(ui, routes, base.chrome, {
      over,
      offerHighlight,
      fullTime,
      see: copy.see,
      again: ui.hud.rematch,
    }),
    saved: score,
    three: {
      aims: aimsFor(ui, phase === "window" ? open : null),
      speed,
      how: three.how,
      keys: three.keys,
      hint: three.hint,
      progress: three.progress,
      loading: three.loading,
    },
  };
}
