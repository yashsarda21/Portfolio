import type { Ref } from "react";
import {
  AttributeToast,
  CallOverlay,
  GAME_STAGE_VIEW,
  Glass,
  MonoLabel,
  PlayerTag,
  PowerMeter,
  ScoreBug,
  ShuttleMark,
  TracerPath,
  TrackingRing,
} from "@/design-system";
import { GameEnd } from "../frame/GameEnd";
import { GameStage } from "../frame/GameStage";
import { ARC, PARKED } from "./flight";
import { HoldButton } from "./HoldButton";
import type { BadmintonPhase, BadmintonView } from "./view";

/**
 * Badminton from 1200px (Badminton-Play, 1440×900): you serve from the near end, Yash reads you from the far one. The
 * power meter and its HOLD · RELEASE button are on the left, the attribute toasts on the right; the shuttle flies the
 * arc between the two rings. Every part is at its board coordinate. `reduced` has no live game, so no meter and no hold.
 */
export function BadmintonStage({
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
  const { bug, call, end, hold, meter } = view;
  return (
    <GameStage
      chrome={view.chrome}
      venue="hall"
      bug={
        <ScoreBug label={bug.label} size="md">
          <ScoreBug.Name>{bug.name}</ScoreBug.Name>
          <ScoreBug.Cell pad="tight">{bug.yash}</ScoreBug.Cell>
          <ScoreBug.Cell pad="tight" muted>
            {bug.you}
          </ScoreBug.Cell>
          <ScoreBug.Away tone="line">{bug.away}</ScoreBug.Away>
          <ScoreBug.Status alert={bug.alert}>{bug.status}</ScoreBug.Status>
        </ScoreBug>
      }
    >
      {/* The board draws no title (G11): screen readers hear this one. */}
      <h1 className="sr-only">{view.heading}</h1>

      <div aria-hidden="true" className="absolute inset-0">
        <TracerPath d={ARC.d} viewBox={GAME_STAGE_VIEW} size="stage">
          <g ref={shuttleRef} className="will-change-transform">
            <ShuttleMark x={PARKED.x} y={PARKED.y} />
          </g>
        </TracerPath>
        <TrackingRing who="yash" size="stage" className="top-83.5 left-190.5 h-3.5 w-14" />
        <PlayerTag className="absolute top-87.5 left-206.5 whitespace-nowrap">
          {view.reading}
        </PlayerTag>
        <TrackingRing who="you" size="stage" className="top-190.5 left-132.5 w-17.5" />
        <MonoLabel
          variant="mono-tag"
          tone="primary"
          className="absolute top-190.5 left-153 whitespace-nowrap"
        >
          {bug.away}
        </MonoLabel>
      </div>

      {reduced ? null : (
        <Glass
          as="section"
          pad="md"
          data-part="power"
          className="absolute top-30 left-9 z-6 flex w-62.5 flex-col gap-4"
        >
          <MonoLabel variant="mono-label" tone="label">
            {meter.label}
          </MonoLabel>
          <PowerMeter zones={meter.zones} legend={meter.legend} size="stage" />
          <HoldButton
            label={hold.label}
            size="bar-lg"
            disabled={phase !== "ready" && phase !== "charging"}
            onCharge={onCharge}
            onRelease={onRelease}
            className="h-14"
          />
        </Glass>
      )}

      <div data-part="toasts" className="absolute top-30 right-9 z-6 flex w-85 flex-col gap-2.5">
        {view.toasts.map((toast, i) => (
          // A group flipping from next to charged is a new toast: it slides in. The others stay as they are.
          <AttributeToast key={`${i}-${toast.state}`} {...toast} />
        ))}
      </div>

      {call ? (
        <CallOverlay
          key={view.played}
          call={call.text}
          tone={call.tone}
          size="stage"
          // The field between the panels (x 306 to 1044): a long call wraps there, over the court, never onto a panel.
          className="absolute top-82 left-76.5 z-6 w-184.5"
        />
      ) : null}

      {phase === "end" && end ? (
        <div className="absolute inset-x-0 top-152.5 z-7 flex justify-center">
          <GameEnd
            size="stage"
            primary={end.primary}
            claim={end.claim}
            again={end.again ? { label: end.again, onClick: onAgain } : undefined}
          />
        </div>
      ) : null}
    </GameStage>
  );
}
