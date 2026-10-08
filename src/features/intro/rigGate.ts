import type { RigResult } from "./rig";

type Timeline = gsap.core.Timeline;

/** What the head turn waits for the strips at the performance beat (L7); the page's loader gives up then too. */
export const RIG_WAIT_MS = 1500;

/** Whether the head turn plays, learned from the rig promise. */
export interface RigWatch {
  result: RigResult | null;
  /** The decision is made once (at the performance beat) and kept for every replay. */
  decided: boolean;
  useStrips: boolean;
}

export function watchRig(rig: Promise<RigResult>): RigWatch {
  const watch: RigWatch = { result: null, decided: false, useStrips: false };
  rig.then(
    (result) => (watch.result = result),
    () => (watch.result = "error"),
  );
  return watch;
}

export interface HeadTurnGate {
  /** Call when the show starts from its beginning (first play and every replay). */
  reset: () => void;
}

/**
 * The head turn is a child timeline (`turn`) placed on `tl` at the performance beat. Only it waits for the
 * strips (L7); the rest of the show never stops, so nothing freezes mid-flight:
 *  - the rig is known to be ready when the beat arrives: the turn plays as placed;
 *  - it is known not to be (timeout, error): the turn never plays and `stand()` leaves the rest pose standing;
 *  - it is not known yet: the turn waits for whichever comes first, the rig or `waitMs`, while `tl` runs on.
 *    Ready in time: the turn plays from its start, late. Otherwise `stand()`.
 * The answer is kept: a replay does not wait again. A timeline killed meanwhile has no parent, and a late
 * timer or promise then does nothing.
 */
export function gateHeadTurn({
  tl,
  turn,
  seconds,
  rig,
  stand,
  waitMs = RIG_WAIT_MS,
}: {
  tl: Timeline;
  turn: Timeline;
  /** The performance beat on `tl`, where `turn` is placed. */
  seconds: number;
  rig: Promise<RigResult>;
  /** The head turn will not play: the rest pose stays and the strips are hidden. */
  stand: () => void;
  waitMs?: number;
}): HeadTurnGate {
  const watch = watchRig(rig);
  // Bumped when the show starts over, so a wait begun in an earlier pass is ignored.
  let epoch = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const decide = () => {
    watch.decided = true;
    watch.useStrips = watch.result === "ready";
  };
  const skip = () => {
    turn.pause();
    stand();
  };

  // A callback on the beat, forward only (a rewind past it must not fire it).
  tl.call(
    () => {
      if (tl.time() < seconds - 1e-6) return;
      if (!watch.decided && watch.result !== null) decide();
      if (watch.decided) {
        // (A turn left waiting by a show that was restarted meanwhile is let go here, right at its place.)
        if (watch.useStrips) turn.resume();
        else skip();
        return;
      }
      turn.pause();
      const mine = epoch;
      const release = () => {
        clearTimeout(timer);
        if (mine !== epoch || !tl.parent || watch.decided) return;
        decide();
        if (!watch.useStrips) return stand();
        // Over already (the playhead was thrown past the end): nothing left to turn for.
        if (tl.time() >= tl.duration()) return;
        turn.startTime(tl.time()).resume();
      };
      timer = setTimeout(release, waitMs);
      rig.then(release, release);
    },
    undefined,
    seconds,
  );

  return {
    reset: () => {
      epoch++;
      clearTimeout(timer);
      // Back in its place after a late start. (Only when it moved: re-placing a child while the parent renders
      // is best left alone.) Whether it plays is settled again at the beat.
      if (Math.abs(turn.startTime() - seconds) > 1e-6) turn.startTime(seconds);
    },
  };
}
