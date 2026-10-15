import { getInningsReveals, type Content, type UiCopy } from "@/content";
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
  CRICKET_BALLS,
  CRICKET_ZONES,
  LINES,
  cricketOver,
  cricketRuns,
  type CricketAim,
  type CricketBall,
  type CricketState,
} from "./referee";

/** The line for a ball: as the referee says, except a 3D dot on an OFF line (beaten) and a 3D full toss for six (spec §4.3). */
function commFor(comm: UiCopy["games"]["cricket"]["comm"], ball: CricketBall): string {
  if (ball.call === "dot" && ball.aim === "off") return comm.beaten;
  if (ball.line === "six" && ball.full) return comm.sixFull;
  return comm[ball.line];
}

/**
 * Where the game is: waiting for the bowl, the bowler running in (3D only: the meter sweeps once), the ball in the
 * air, the call, the 2 s verdict, the end buttons. The run-up draws like the flight: no call yet.
 */
export type CricketPhase = "ready" | "runup" | "flight" | "called" | "verdict" | "end";

type Range = [number, number];
type BallState = "for" | "against" | "current" | "pending";

/** A slot of the STADIUM SCREEN: what `RevealList` takes. */
export type CricketSlot =
  | { state: "open"; eyebrow: string; title: string; meta: string }
  | { state: "locked"; label: string; hint: string };

export interface CricketView {
  chrome: GameChrome;
  bug: {
    /** The group's accessible name. */
    label: string;
    name: string;
    /** "6*" | "14*" */
    score: string;
    /** "BALL 2 OF 3" | "OVER COMPLETE" */
    meta: string;
    away: string;
    /** The phone's meta: "YOU BOWLING · 2/3" | "OVER COMPLETE" */
    metaPhone: string;
  };
  /** "YASH · ON STRIKE · 6*" */
  onStrike: string;
  /** The phone's tag, which leaves the score to the bug: "YASH · ON STRIKE" */
  tagPhone: string;
  /** "YOU · BOWLING" */
  youTag: string;
  /** How many balls have been bowled (0 to 3). */
  bowled: number;
  /** The over, a cell per ball. */
  balls: { label: string; state: BallState }[];
  screen: { title: string; count: string; slots: CricketSlot[] };
  /** The newest open slot, as the phone's chip: null before the first ball. */
  latest: { eyebrow: string; title: string; meta: string } | null;
  /** The big call for the last ball: only while it is being called. */
  call: { text: string; tone: "volt" | "floodlight" } | null;
  /** The commentary line for the last ball; the arrival line before the first. */
  comm: string;
  /** What a screen reader hears of the last ball: the call and what it unlocked. "" before ball 1. */
  announce: string;
  meter: {
    labels: { start: string; target: string; end: string };
    /** The zones in % of the track, for each layout (the phone's is wider). */
    zones: Record<"stage" | "column", { good: Range; perfect: Range }>;
  };
  bowl: { label: string; labelPhone: string; hint: string };
  /** What the end offers; null while the over is still being bowled. */
  end: GameEndView | null;
  /** The result saved to the match record and shown on the Hub: "14* NOT OUT" | "4* NOT OUT". */
  saved: string;
  heading: string;
  headline: string;
  how: string;
  pitch: { yorker: string; good: string };
}

/** A zone as % of the track, rounded so 0.5 - 0.035 reads 46.5, not 46.50000000000001. */
const zone = (half: number): Range => [pct(0.5 - half), pct(0.5 + half)];
const pct = (fraction: number) => Math.round(fraction * 100 * 1000) / 1000;

/** Everything the cricket game shows, as plain words, from the content, the copy and the over so far (G4, G7, G8). */
export function buildCricketView(
  content: Content,
  ui: UiCopy,
  routes: typeof ROUTES,
  state: CricketState,
  { phase, offerHighlight, fullTime }: { phase: CricketPhase } & EndFlags,
): CricketView {
  const copy = ui.games.cricket;
  const sep = ui.glyph.sep;
  const chrome = buildGameChrome(ui, routes, "cricket");
  const yash = ui.hub.record.yash;
  const bowled = state.balls.length;
  const over = cricketOver(state);

  const runs = cricketRuns(state);
  const score = `${runs}${copy.notOutMark}`;
  const saved = `${score} ${copy.notOut}`;

  // G7: innings 01 and 02 are the first two roles, the third is the academy, however many roles the content grows.
  const reveals = getInningsReveals(content);
  const careers = reveals.filter((r) => r.kind === "career").slice(0, CRICKET_BALLS - 1);
  const academy = reveals.find((r) => r.kind === "academy");
  const innings = [...careers, ...(academy ? [academy] : [])].map((r, i) => ({
    n: String(i + 1).padStart(2, "0"),
    status: r.status,
    team: r.team.toUpperCase(),
    role: r.role,
    span: r.span,
  }));

  const slots = innings.map((row, i): CricketSlot => {
    const ball = i + 1;
    return i < bowled
      ? {
          state: "open",
          eyebrow: `${copy.innings} ${row.n} ${sep} ${row.status}`,
          title: row.team,
          meta: `${row.role} ${sep} ${row.span}`,
        }
      : {
          state: "locked",
          label: `${copy.innings} ${row.n} ${sep} ${copy.locked}`,
          hint: `${copy.bowlBall} ${ball}`,
        };
  });

  const newest = bowled > 0 ? innings[bowled - 1] : undefined;
  const last = state.balls[bowled - 1];
  const call: CricketView["call"] = last
    ? { text: copy.calls[last.call], tone: last.forYou ? "volt" : "floodlight" }
    : null;
  const calling = phase === "called" || phase === "verdict" || phase === "end";

  const ballNo = Math.min(bowled + 1, CRICKET_BALLS);

  return {
    chrome,
    bug: {
      label: ui.games.bug,
      name: yash,
      score,
      meta: over ? copy.over : `${copy.ball} ${ballNo} ${copy.of} ${CRICKET_BALLS}`,
      away: copy.away,
      metaPhone: over ? copy.over : `${copy.away} ${sep} ${ballNo}/${CRICKET_BALLS}`,
    },
    onStrike: [yash, copy.onStrike, score].join(` ${sep} `),
    tagPhone: [yash, copy.onStrike].join(` ${sep} `),
    bowled,
    youTag: `${ui.hub.record.you} ${sep} ${copy.bowling}`,
    balls: Array.from({ length: CRICKET_BALLS }, (_, i) => {
      const ball = state.balls[i];
      if (!ball) return { label: String(i + 1), state: i === bowled ? "current" : "pending" };
      const label = ball.runs === 0 ? ui.glyph.bullet : String(ball.runs);
      return { label, state: ball.forYou ? "for" : "against" };
    }),
    screen: {
      title: copy.screen,
      count: `${bowled} / ${CRICKET_BALLS} ${ui.games.unlocked}`,
      slots,
    },
    latest: newest
      ? {
          eyebrow: `${copy.innings} ${newest.n} ${ui.games.unlocked} ${sep} ${newest.status}`,
          title: newest.team,
          meta: `${newest.role} ${sep} ${newest.span}`,
        }
      : null,
    call: calling ? call : null,
    comm: last ? commFor(copy.comm, last) : copy.comm.start,
    announce:
      last && newest
        ? announceWith(
            `${copy.calls[last.call]} ${sentenceCase(copy.innings)} ${newest.n} ${ui.games.unlocked.toLowerCase()}: ${newest.team}, ${newest.role}, ${newest.span}`,
            // "Over complete. Yash 14 not out."
            over
              ? `${sentenceCase(copy.over)}. ${sentenceCase(yash)} ${sentenceCase(`${runs} ${copy.notOut}`)}`
              : null,
          )
        : "",
    meter: {
      labels: { start: copy.meter.short, target: copy.meter.yorker, end: copy.meter.full },
      zones: {
        stage: { good: zone(CRICKET_ZONES.stage.good), perfect: zone(CRICKET_ZONES.stage.perfect) },
        column: {
          good: zone(CRICKET_ZONES.column.good),
          perfect: zone(CRICKET_ZONES.column.perfect),
        },
      },
    },
    bowl: { label: copy.bowl, labelPhone: copy.bowlPhone, hint: copy.touchHint },
    end: buildGameEnd(ui, routes, chrome, {
      over,
      offerHighlight,
      fullTime,
      see: copy.see,
      again: copy.again,
    }),
    saved,
    heading: chrome.heading,
    headline: copy.headline,
    how: copy.how,
    pitch: { yorker: copy.pitch.yorker, good: copy.pitch.good },
  };
}

/** What the 3D game adds to the board: the line picker, BOWL's labels (RELEASE in the run-up), the speed gun, the loader. */
export interface Cricket3dControls {
  lines: {
    label: string;
    keys: string;
    options: { id: CricketAim; label: string; pressed: boolean }[];
  };
  bowl: { label: string; labelPhone: string };
  /** "143 KM/H" from the release until the next one; null before the first ball. */
  speed: string | null;
  loading: string;
  how: string;
}

/** The 3D game's controls as plain words, from the copy and where the ball is (spec §3.2, §4.2). */
export function buildCricket3dControls(
  ui: UiCopy,
  { phase, aim, speedKmh }: { phase: CricketPhase; aim: CricketAim; speedKmh: number | null },
): Cricket3dControls {
  const copy = ui.games.cricket;
  const runup = phase === "runup";
  return {
    lines: {
      label: copy.line.label,
      keys: copy.line.keys,
      options: LINES.map((id) => ({ id, label: copy.line[id], pressed: id === aim })),
    },
    bowl: runup
      ? { label: copy.release, labelPhone: copy.releasePhone }
      : { label: copy.bowl, labelPhone: copy.bowlPhone },
    speed: speedKmh === null ? null : `${speedKmh} ${ui.games.kmh}`,
    loading: copy.loading,
    how: copy.how3d,
  };
}
