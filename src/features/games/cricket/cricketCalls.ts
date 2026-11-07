import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { VERDICT_MS } from "../engine/beats";
import { perfectShare } from "../engine/form";
import { holdFor } from "../engine/spotlight";
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
  finish(
    next: CricketState,
    result: { score: string; form: number },
    extra?: object,
    sound?: { cheer?: boolean; endMs?: number },
  ): void;
}

/**
 * How a judged ball is called, for both cricket games: the call, what it unlocked, the sound and the line; the over's
 * end is saved at once (G8). `callMs` is how long the call holds before the next ball (an unlock holds
 * `SPOTLIGHT_MS` instead); `sounds: false` leaves the
 * bat's crack and the boundary's cheer to the caller (the 3D game plays them on the picture: at contact, at the rope).
 * A plain function, not a hook: it only closes over the session.
 */
export function cricketCalls(session: CricketSession) {
  const { live, commit, timers, finish } = session;

  const land = (next: CricketState, { callMs, sounds }: { callMs: number; sounds: boolean }) => {
    const over = cricketOver(next);
    const after = buildCricket(next, { phase: "called", ...NO_END_FLAGS });
    const ball = next.balls.at(-1);
    const now = live.current;
    if (sounds && ball && ball.runs > 0) now.audio.play("bat");
    if (now.desktop) now.say(after.comm, { interrupt: true });
    // Every ball unlocks an innings: it chimes as its spotlight appears.
    if (after.spotlight?.kind === "unlock") now.audio.play("reveal");
    if (!over) {
      commit({ game: next, phase: "called" });
      // The ball's innings stays up in the spotlight, then leaves for its slot. Reduced motion plays the over by itself.
      if (!now.reduced)
        timers.after(holdFor(after.spotlight, callMs), () => commit({ phase: "ready" }));
      return;
    }
    // The last ball's innings holds its full spotlight before the end buttons.
    finish(
      next,
      { score: after.saved, form: perfectShare(next.balls) },
      {},
      { cheer: sounds, endMs: holdFor(after.spotlight, VERDICT_MS) },
    );
  };

  return { land };
}
