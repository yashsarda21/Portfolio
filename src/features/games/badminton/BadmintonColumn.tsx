import { useRef, type PointerEvent, type Ref } from "react";
import {
  CourtBox,
  CourtMark,
  GAME_COURT_VIEW,
  MonoLabel,
  PlayerTag,
  PowerMeter,
  RevealChip,
  ScoreBug,
  Spotlight,
  ShuttleMark,
  TracerPath,
  TrackingRing,
} from "@/design-system";
import { cn } from "@/lib/cn";
import { GameColumn } from "../frame/GameColumn";
import { GameEnd } from "../frame/GameEnd";
import { PickPair } from "../frame/PickPair";
import { GameLoader } from "../three/GameLoader";
import type { Dir } from "./3d/match";
import type { BadmintonThree } from "./BadmintonPage";
import { ARC, PARKED, YASH_RING } from "./flight";
import { HoldButton } from "./HoldButton";
import type { Badminton3dPhase, BadmintonPhase, BadmintonView } from "./view";

/** A swipe is a finger (or pen) that moves this far up or down, and more up or down than across. */
const SWIPE_PX = 40;

/**
 * Badminton below 1200px (derived from Mobile-Game and Badminton-Play): the hall's court rises away from your thumb.
 * The score is at the top with SKIP, the newest charged group in a chip, a slim power meter stands at the right edge
 * above the thumb zone, and the thumb zone holds the hint and a full-width press-and-hold button. The court is the
 * stage's, cropped and scaled to the width, so every part of the field is drawn in the stage's own coordinates inside
 * the same box as the court (the arc, the shuttle, Yash's ring) or on its centre line (x 720: the tag and the call),
 * and nothing drifts with the width (D-9).
 *
 * With `three` (the 3D game): the scene fills the screen behind everything once it is ready, and only the call is
 * drawn on the field; the newest charge's chip fades out after a moment, keeping its place. The thumb zone has the hint and the two pick buttons (while the 3D loads, they hold their place,
 * unseen, with the loader over them). A swipe up on the field is deep and a swipe down is short, only while a pick is
 * taken: then the field takes the touch (`touch-none`); at any other time the page scrolls over it as usual.
 */
export function BadmintonColumn({
  view,
  phase,
  reduced,
  onCharge,
  onRelease,
  onPick,
  onAgain,
  shuttleRef,
  three,
}: {
  view: BadmintonView;
  phase: BadmintonPhase | Badminton3dPhase;
  reduced: boolean;
  onCharge: () => void;
  onRelease: () => void;
  onPick: (dir: Dir) => void;
  onAgain: () => void;
  shuttleRef?: Ref<SVGGElement>;
  three?: BadmintonThree;
}) {
  const { bug, spotlight, end, hold, latest, meter } = view;
  const [smash, , drop] = meter.legend;
  const ready = three?.status === "ready";
  /** The 3D game takes a pick only while one is taken. */
  const choose = (dir: Dir) => {
    if (three?.live) onPick(dir);
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
    if (phase === "window" && Math.abs(dy) > SWIPE_PX && Math.abs(dy) > Math.abs(dx)) {
      choose(dy < 0 ? "deep" : "short");
    }
  };

  const callOverlay = spotlight ? (
    <Spotlight
      key={view.played}
      spotlight={spotlight}
      size="column"
      className="absolute inset-x-0 top-82 short:top-48"
    />
  ) : null;

  if (three) {
    const parts = three.parts;
    const controls = (
      <>
        <MonoLabel
          data-part="hint"
          variant="mono-chip"
          tone="label"
          className="text-center text-balance"
        >
          {parts.hint.phone}
        </MonoLabel>
        <PickPair
          aims={parts.aims.map((aim) => ({
            key: aim.dir,
            arrow: aim.shot,
            name: aim.name,
            open: aim.open,
          }))}
          live={three.live}
          onPick={choose}
        />
      </>
    );
    return (
      <GameColumn
        chrome={view.chrome}
        venue="hall"
        scene={three.scene}
        sceneHidden={!ready}
        sceneDrawn={three.drawn}
        heading={view.heading}
        bug={
          <ScoreBug label={bug.label} size="sm">
            <ScoreBug.Name>{bug.name}</ScoreBug.Name>
            <ScoreBug.Cell>{bug.yash}</ScoreBug.Cell>
            <ScoreBug.Cell muted>{bug.you}</ScoreBug.Cell>
            {bug.phoneBadge ? (
              <ScoreBug.Status alert={bug.alert}>{bug.statusPhone}</ScoreBug.Status>
            ) : (
              <ScoreBug.Meta>{bug.statusPhone}</ScoreBug.Meta>
            )}
          </ScoreBug>
        }
        reveal={
          latest ? (
            // Each new charge shows for a moment, then fades out, keeping its place (owner play-test 1): the court is
            // clear for play. The announcer reads every charge.
            <div key={latest.eyebrow} data-part="reveal" className="animate-fade-away">
              <RevealChip key={view.played} {...latest} />
            </div>
          ) : null
        }
        field={
          <div
            aria-hidden="true"
            data-part="field"
            onPointerDown={down}
            onPointerUp={up}
            onPointerCancel={() => (start.current = null)}
            className={cn(
              "absolute inset-0",
              three && phase === "window" ? "touch-none" : "touch-pan-y",
            )}
          >
            {callOverlay}
          </div>
        }
        thumb={
          phase === "end" && end ? (
            <GameEnd size="column" end={end} onAgain={onAgain} />
          ) : !ready ? (
            // While the 3D loads, the controls hold their place, unseen, with the loader over the buttons: when they
            // appear, the thumb zone is already their height, so nothing moves.
            <div className="relative flex w-full flex-col items-center gap-4 short:gap-2">
              <div inert className="invisible flex w-full flex-col items-center gap-4 short:gap-2">
                {controls}
              </div>
              <div className="absolute inset-x-0 bottom-0">
                <GameLoader label={parts.loading} progress={three.progress} size="column" />
              </div>
            </div>
          ) : (
            controls
          )
        }
      />
    );
  }

  return (
    <GameColumn
      chrome={view.chrome}
      venue="hall"
      heading={view.heading}
      bug={
        <ScoreBug label={bug.label} size="sm">
          <ScoreBug.Name>{bug.name}</ScoreBug.Name>
          <ScoreBug.Cell>{bug.yash}</ScoreBug.Cell>
          <ScoreBug.Cell muted>{bug.you}</ScoreBug.Cell>
          {bug.phoneBadge ? (
            <ScoreBug.Status alert={bug.alert}>{bug.statusPhone}</ScoreBug.Status>
          ) : (
            <ScoreBug.Meta>{bug.statusPhone}</ScoreBug.Meta>
          )}
        </ScoreBug>
      }
      reveal={latest ? <RevealChip key={view.played} {...latest} /> : null}
      field={
        <div aria-hidden="true" data-part="field" className="absolute inset-0">
          {/* The court's own box: the backdrop's court fills it, so the stage's coordinates line up with the court. */}
          <CourtBox>
            <TracerPath d={ARC.d} viewBox={GAME_COURT_VIEW.hall} size="column" slice>
              <g ref={shuttleRef}>
                <ShuttleMark x={PARKED.x} y={PARKED.y} />
              </g>
            </TracerPath>
            {/* Yash's ring stands where the arc ends, on the court at any width. */}
            <CourtMark venue="hall" x={YASH_RING.x} y={YASH_RING.y}>
              <TrackingRing who="yash" size="column" className="relative" />
            </CourtMark>
            <PlayerTag
              live={false}
              className="absolute top-24 left-1/2 -translate-x-1/2 px-1.75 py-1 whitespace-nowrap"
            >
              {view.reading}
            </PlayerTag>
          </CourtBox>
          {callOverlay}
        </div>
      }
      thumb={
        phase === "end" && end ? (
          <GameEnd size="column" end={end} onAgain={onAgain} />
        ) : reduced ? null : (
          <>
            {/* In the thumb zone's own layer, so the zone's fade does not dim it: just above the hint, at the right edge. */}
            <div
              aria-hidden="true"
              className="absolute right-3 bottom-48 flex h-60 gap-2 md:right-5 short:bottom-20 short:h-32"
            >
              <div className="flex flex-col items-end justify-between">
                <MonoLabel variant="mono-tag" tone="volt">
                  {smash?.name}
                </MonoLabel>
                <MonoLabel variant="mono-tag" tone="label">
                  {drop?.name}
                </MonoLabel>
              </div>
              <PowerMeter zones={meter.zones} legend={meter.legend} size="column" />
            </div>
            <MonoLabel
              data-part="hint"
              variant="mono-chip"
              tone="label"
              className="text-center text-balance"
            >
              {hold.phoneHint}
            </MonoLabel>
            <HoldButton
              label={hold.label}
              size="tap"
              disabled={phase !== "ready" && phase !== "charging"}
              onCharge={onCharge}
              onRelease={onRelease}
            />
          </>
        )
      }
    />
  );
}
