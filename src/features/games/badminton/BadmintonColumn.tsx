import type { Ref } from "react";
import {
  CallOverlay,
  CourtBox,
  CourtMark,
  GAME_COURT_VIEW,
  MonoLabel,
  PlayerTag,
  PowerMeter,
  RevealChip,
  ScoreBug,
  ShuttleMark,
  TracerPath,
  TrackingRing,
} from "@/design-system";
import { GameColumn } from "../frame/GameColumn";
import { GameEnd } from "../frame/GameEnd";
import { ARC, PARKED, YASH_RING } from "./flight";
import { HoldButton } from "./HoldButton";
import type { BadmintonPhase, BadmintonView } from "./view";

/**
 * Badminton below 1200px (derived from Mobile-Game and Badminton-Play): the hall's court rises away from your thumb.
 * The score is at the top with SKIP, the newest charged group in a chip, a slim power meter stands at the right edge
 * above the thumb zone, and the thumb zone holds the hint and a full-width press-and-hold button. The court is the
 * stage's, cropped and scaled to the width, so every part of the field is drawn in the stage's own coordinates inside
 * the same box as the court (the arc, the shuttle, Yash's ring) or on its centre line (x 720: the tag and the call),
 * and nothing drifts with the width (D-9).
 */
export function BadmintonColumn({
  view,
  phase,
  reduced,
  onCharge,
  onRelease,
  onAgain,
  shuttleRef,
}: {
  view: BadmintonView;
  phase: BadmintonPhase;
  reduced: boolean;
  onCharge: () => void;
  onRelease: () => void;
  onAgain: () => void;
  shuttleRef?: Ref<SVGGElement>;
}) {
  const { bug, call, end, hold, latest, meter } = view;
  const [smash, , drop] = meter.legend;
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
              <g ref={shuttleRef} className="will-change-transform">
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
          {call ? (
            <CallOverlay
              key={view.played}
              call={call.text}
              tone={call.tone}
              size="column"
              className="absolute inset-x-0 top-82 short:top-48"
            />
          ) : null}
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
