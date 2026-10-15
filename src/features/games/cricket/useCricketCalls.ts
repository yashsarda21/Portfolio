import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { perfectShare } from "../engine/form";
import type { GameSession } from "../engine/useGameSession";
import { NO_END_FLAGS, type EndFlags } from "../engine/useMatchResult";
import { cricketOver, type CricketState } from "./referee";
import { buildCricketView, type CricketPhase } from "./view";

/** The cricket view builder with the content, the copy and the routes given: one function, so the session's view is memoised. */
export const buildCricket = (game: CricketState, at: { phase: CricketPhase } & EndFlags) =>
  buildCricketView(content, ui, ROUTES, game, at);

/** What landing a ball needs of a cricket game's session (the 2D and the 3D game's runs differ in their other fields). */
interface CricketSession extends Pick<GameSession, "live" | "timers"> {
  commit(patch: { game?: CricketState; phase?: CricketPhase }): void;
  finish(next: CricketState, result: { score: string; form: number }): void;
}

/**
 * How a judged ball is called, for both cricket games: the call, what it unlocked, the sound and the line; the over's
 * end is saved at once (G8). `callMs` is how long the call holds before the next ball; `bat: false` leaves the bat's
 * crack to the caller (the 3D game plays it at the moment of contact).
 */
export function useCricketCalls(session: CricketSession) {
  const { live, commit, timers, finish } = session;

  const land = (next: CricketState, { callMs, bat }: { callMs: number; bat: boolean }) => {
    const over = cricketOver(next);
    const after = buildCricket(next, { phase: "called", ...NO_END_FLAGS });
    const ball = next.balls.at(-1);
    const now = live.current;
    if (bat && ball && ball.runs > 0) now.audio.play("bat");
    if (now.desktop) now.say(after.comm, { interrupt: true });
    if (!over) {
      commit({ game: next, phase: "called" });
      timers.after(callMs, () => commit({ phase: "ready" }));
      return;
    }
    finish(next, { score: after.saved, form: perfectShare(next.balls) });
  };

  return { land };
}
