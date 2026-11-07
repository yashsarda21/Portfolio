import { getAttributeGroups, type Content, type UiCopy } from "@/content";
import type { AttributeToastProps } from "@/design-system";
import type { ROUTES } from "@/shell/routes";
import { yoursText, type GameSpotlight } from "../engine/spotlight";
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
  /** The phone button's words: the arrow and the shot, "↓ DROP" (it stays the same when the button is lit). */
  shot: string;
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
  /** One per rally: the groups charged so far (the newest waits while its spotlight is up), the next one, and those after it. */
  toasts: AttributeToastProps[];
  /** The newest charge as the phone's chip (it too waits while its spotlight is up): null before the first rally. */
  latest: { eyebrow: string; title: string; meta: string } | null;
  /** How many rallies have been played (0 to 4 in 2D, up to 6 in 3D): a new call, a new charge. */
  played: number;
  /**
   * The centre of the screen after a rally (owner, 2026-11-07): the group it charged with its skills, or the visitor's
   * "WELL PLAYED." Null before a rally, during play, and when Yash wins a rally that charges nothing. */
  spotlight: GameSpotlight | null;
  /** The commentary line for the last rally; the arrival line before the first. */
  comm: string;
  /** What a screen reader hears of the last rally: what it charged. "" before rally 1. */
  announce: string;
  /** What the end offers; null while the game is still being played. */
  end: GameEndView | null;
  /** The result saved to the match record and shown on the Hub: "21–19". */
  saved: string;
  heading: string;
}

/** The charged group in the spotlight: the toast's own eyebrow and title, then its skills. It goes to the right, where the toasts are. */
function unlockOf(
  group: { eyebrow: string; title: string; chips: readonly string[] },
  sep: string,
): GameSpotlight {
  return {
    kind: "unlock",
    eyebrow: group.eyebrow,
    title: group.title,
    line: group.chips.join(` ${sep} `),
    to: "right",
  };
}

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
  const newest = charged.at(-1);
  const last = state.rallies.at(-1);
  // Each rally charges its group: the toast waits in the spotlight's place until the spotlight has left (phase "called").
  const shown = phase === "called" && newest ? played - 1 : played;
  const toasts: AttributeToastProps[] = groups.map((g, i) =>
    i < shown
      ? { state: "charged", ...charged[i]!, accent: i === shown - 1 }
      : {
          state: i === shown ? "next" : "later",
          label: g.name.toUpperCase(),
          hint: i === shown ? `${copy.upNext} ${sep} ${rallyName(i + 1)}` : rallyName(i + 1),
        },
  );
  const latest = charged[shown - 1];

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
    latest: latest
      ? {
          eyebrow: latest.eyebrow,
          title: latest.title,
          meta: latest.chips.join(` ${sep} `),
        }
      : null,
    played,
    spotlight: calling && last && newest ? unlockOf(newest, sep) : null,
    comm,
    announce:
      last && newest
        ? announceWith(
            `${sentenceCase(copy.charged)}, ${rallyName(played).toLowerCase()}: ${newest.title}, ${newest.chips.join(", ")}`,
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

/** The two pick buttons, the short one then the deep one; `open` (if any) is lit. */
function aimsFor(ui: UiCopy, open: Dir | null): [BadmintonAim, BadmintonAim] {
  const aim = ui.games.badminton.three.aim;
  const ARROW = aim.arrow;
  const one = (dir: Dir): BadmintonAim => {
    const lit = open === dir;
    return {
      dir,
      arrow: ARROW[dir],
      shot: `${ARROW[dir]} ${aim[dir]}`,
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
  const newest = charged.at(-1);
  const last = state.rallies.at(-1);
  const lastGroup = last?.card != null ? groups[last.card] : undefined;
  // The group your rally charged waits in the spotlight's place until the spotlight has left (phase "called").
  const shown = phase === "called" && lastGroup && newest ? charged.length - 1 : charged.length;
  // Never LOCKED (§11.2 #24): the next group is UP NEXT. Rally numbers shift when you win one, so the later ones name their shot.
  const toasts: AttributeToastProps[] = groups.map((g, i) =>
    i < shown
      ? { state: "charged", ...charged[i]!, accent: i === shown - 1 }
      : {
          state: i === shown ? "next" : "later",
          label: g.name.toUpperCase(),
          hint: i === shown ? copy.upNext : g.shot.toUpperCase(),
        },
  );
  const latest = charged[shown - 1];
  // Your rallies say "WELL PLAYED." and so on in turn; Yash's rally that charges nothing shows nothing.
  const yours =
    last?.winner === "you"
      ? yoursText(ui.games.yours, state.rallies.filter((r) => r.winner === "you").length)
      : null;

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

  // Too late or too early, you missed it (owner play-test ruling): he played no card shot, so the line names none.
  const missed = last?.call === "late" || last?.call === "early";
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
            ? `${missed ? "" : `${three.comm[last.kind]} `}${lastGroup.name} ${three.comm.charged}`
            : three.comm[last.kind];

  // Yash's smash win is on the speed gun while it is called; the OUT call is his by a whisker, and your miss is no
  // shot of his: neither is a smash.
  const kmh =
    last && last.winner === "yash" && last.call !== "out" && !missed ? smashKmh(last.kind) : null;
  const speed =
    calling && kmh !== null
      ? [ui.hub.record.yash, three.speed, `${kmh} ${ui.games.kmh}`].join(` ${sep} `)
      : null;
  // "Backend charged: Java, Spring Boot, JUnit." Your own rally charges nothing.
  const lastChips = lastGroup
    ? lastGroup.skills.filter((k) => k.level === "shipped").map((k) => k.name)
    : [];
  const spoken = [
    `${yours ? `${yours} ` : ""}${score}.`,
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
    latest: latest
      ? { eyebrow: latest.eyebrow, title: latest.title, meta: latest.chips.join(` ${sep} `) }
      : null,
    played,
    spotlight: !calling
      ? null
      : yours
        ? { kind: "yours", text: yours }
        : lastGroup && newest
          ? unlockOf(newest, sep)
          : null,
    comm,
    announce: last
      ? announceWith(
          // The line already ends with its own full stop: when the game is over, announceWith adds the outcome after it.
          over ? spoken.slice(0, -1) : spoken,
          over ? sentenceCase(status) : null,
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
