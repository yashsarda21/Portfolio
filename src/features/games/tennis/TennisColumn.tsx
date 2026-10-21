import { useRef, type PointerEvent, type Ref } from "react";
import {
  AimZone,
  GAME_COURT_VIEW,
  Button,
  CallOverlay,
  CourtBox,
  MonoLabel,
  PlayerTag,
  RevealChip,
  ScoreBug,
  TracerPath,
  TrackingRing,
} from "@/design-system";
import { cn } from "@/lib/cn";
import { GameColumn } from "../frame/GameColumn";
import { GameEnd } from "../frame/GameEnd";
import { GameLoader } from "../three/GameLoader";
import { returnPath, SERVE } from "./flight";
import type { Side } from "./referee";
import type { TennisThree } from "./TennisPage";
import { LIVE_PHASES, type Tennis3dPhase, type TennisPhase, type TennisView } from "./view";

/** A swipe is a finger (or pen) that moves this far sideways, and more sideways than up or down. */
const SWIPE_PX = 40;

/**
 * Tennis below 1200px (derived from Mobile-Game and Tennis-Play): the court rises away from your thumb. The score is
 * at the top with SKIP, the newest highlight in a chip, and under the thumb a big ← and → (the open side lit) with a
 * hint. The court is the stage's, cropped and scaled to the width, so every part of the field is drawn in the stage's
 * own coordinates inside the same box as the court, and stands on the court's centre line (x 720) at any width (D-9).
 * A swipe left or right anywhere on the court returns to that side too (G3); vertical swipes are left to the browser.
 *
 * With `three` (the 3D game): the scene fills the screen behind everything once it is ready, and only the call is
 * drawn on the field. While it loads, the thumb zone holds the controls' place, unseen, with the loader over them.
 * The swipe and the ← / → halves pick only while a pick is taken.
 */
export function TennisColumn({
  view,
  phase,
  reduced,
  shot,
  onPick,
  onAgain,
  ballRef,
  three,
}: {
  view: TennisView;
  phase: TennisPhase | Tennis3dPhase;
  reduced: boolean;
  shot: Side | null;
  onPick: (side: Side) => void;
  onAgain: () => void;
  ballRef?: Ref<SVGCircleElement>;
  three?: TennisThree;
}) {
  const { bug, call, end, latest, instructions } = view;
  const live = three ? three.live : (LIVE_PHASES as readonly string[]).includes(phase) && !reduced;
  const returning = shot !== null && (phase === "called" || phase === "verdict");
  const ready = three?.status === "ready";
  /** The 3D game takes a pick only while one is taken; the 2D game judges every pick itself. */
  const choose = (side: Side) => {
    if (!three || three.live) onPick(side);
  };

  const start = useRef<{ id: number; x: number; y: number } | null>(null);
  const down = (e: PointerEvent) => {
    start.current =
      e.pointerType === "touch" || e.pointerType === "pen"
        ? { id: e.pointerId, x: e.clientX, y: e.clientY }
        : null;
  };
  const up = (e: PointerEvent) => {
    const from = start.current;
    start.current = null;
    if (!from || from.id !== e.pointerId) return;
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) choose(dx > 0 ? "right" : "left");
  };

  const callOverlay = call ? (
    <CallOverlay
      key={view.returned}
      call={call.text}
      tone={call.tone}
      size="column"
      className="absolute inset-x-0 top-94 short:top-48"
    />
  ) : null;
  const controls = (
    <>
      <MonoLabel
        data-part="hint"
        variant="mono-chip"
        tone="label"
        className="text-center text-balance"
      >
        {instructions.phoneHint}
      </MonoLabel>
      <div className="flex w-full gap-3">
        {view.aims.map((aim) => (
          <Button
            key={aim.side}
            size="tap"
            skew={false}
            glow={false}
            variant={aim.open ? "primary" : "secondary"}
            aria-label={aim.name}
            aria-disabled={!live}
            data-game-control=""
            onClick={() => choose(aim.side)}
            className="min-w-0 flex-1"
          >
            {aim.arrow}
          </Button>
        ))}
      </div>
    </>
  );

  return (
    <GameColumn
      chrome={view.chrome}
      venue="court"
      scene={three?.scene}
      sceneHidden={!ready}
      sceneDrawn={three?.drawn}
      heading={view.heading}
      bug={
        <ScoreBug label={bug.label} size="sm">
          <ScoreBug.Name serving>{bug.name}</ScoreBug.Name>
          <ScoreBug.Cell>{bug.yash}</ScoreBug.Cell>
          <ScoreBug.Cell muted>{bug.you}</ScoreBug.Cell>
          <ScoreBug.Meta>{bug.statusPhone}</ScoreBug.Meta>
        </ScoreBug>
      }
      reveal={latest ? <RevealChip key={view.returned} {...latest} /> : null}
      field={
        <div
          aria-hidden="true"
          data-part="field"
          onPointerDown={down}
          onPointerUp={up}
          onPointerCancel={() => (start.current = null)}
          className="absolute inset-0 touch-pan-y"
        >
          {/* The court's own box: the backdrop's court fills it, so the stage's coordinates line up with the court. */}
          {three ? null : (
            <CourtBox>
              {reduced ? null : (
                <>
                  <TracerPath
                    d={SERVE.d}
                    viewBox={GAME_COURT_VIEW.court}
                    size="column"
                    draw={phase === "ready" ? 0 : 1}
                    drawVar="--serve"
                    slice
                    bounce={SERVE.bounce}
                  >
                    <circle
                      ref={ballRef}
                      data-part="ball"
                      r={6}
                      opacity={0}
                      className="fill-floodlight"
                    />
                  </TracerPath>
                  {returning ? (
                    <TracerPath
                      key={view.returned}
                      d={returnPath(shot)}
                      viewBox={GAME_COURT_VIEW.court}
                      size="column"
                      drawVar={`--return-${shot}`}
                      slice
                    />
                  ) : null}
                </>
              )}
              <TrackingRing who="yash" size="column" className="top-1 left-1/2 -ml-5.75" />
              {view.aims.map((aim) => (
                <AimZone
                  key={aim.side}
                  label={aim.label}
                  name={aim.name}
                  open={aim.open}
                  disabled={!live}
                  tabbable={false}
                  onPick={() => onPick(aim.side)}
                  className={cn(
                    "absolute top-8",
                    aim.side === "left" ? "right-1/2 mr-1.5" : "left-1/2 ml-1.5",
                  )}
                />
              ))}
              <PlayerTag
                live={false}
                className="absolute top-24 left-1/2 -translate-x-1/2 px-1.75 py-1 whitespace-nowrap"
              >
                {view.serving}
              </PlayerTag>
            </CourtBox>
          )}
          {callOverlay}
        </div>
      }
      thumb={
        phase === "end" && end ? (
          <GameEnd size="column" end={end} onAgain={onAgain} />
        ) : reduced ? null : three && !ready ? (
          // While the 3D loads, the controls hold their place, unseen, with the loader over the halves: when they
          // appear, the thumb zone is already their height, so nothing moves.
          <div className="relative flex w-full flex-col items-center gap-4 short:gap-2">
            <div inert className="invisible flex w-full flex-col items-center gap-4 short:gap-2">
              {controls}
            </div>
            <div className="absolute inset-x-0 bottom-0">
              <GameLoader label={three.loading} progress={three.progress} size="column" />
            </div>
          </div>
        ) : (
          controls
        )
      }
    />
  );
}
