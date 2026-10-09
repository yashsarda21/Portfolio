import type { Ref } from "react";
import {
  Button,
  CallOverlay,
  MonoLabel,
  PlayerTag,
  RevealChip,
  ScoreBug,
  TimingMeter,
  TracerPath,
  TrackingRing,
} from "@/design-system";
import { GameColumn } from "../frame/GameColumn";
import { GameEnd } from "../frame/GameEnd";
import { TRACER } from "./flight";
import type { CricketPhase, CricketView } from "./view";

/**
 * Cricket below 1200px (Mobile-Game, 390×844): the pitch rises away from your thumb. The score is at the top with
 * SKIP, the newest innings in a chip, and the length meter and the TAP TO BOWL button under the thumb. The field
 * is drawn in the board's 390×844 space, centred, so the rings and the tracer sit on the pitch at any width. The
 * pitch's centre line is x 195 there: the ring (46 wide), the tracer's top and the ball all stand on it (D-9).
 */
export function CricketColumn({
  view,
  phase,
  reduced,
  onBowl,
  onAgain,
  ballRef,
}: {
  view: CricketView;
  phase: CricketPhase;
  reduced: boolean;
  onBowl: () => void;
  onAgain: () => void;
  ballRef?: Ref<HTMLSpanElement>;
}) {
  const { bug, call, end, latest } = view;
  return (
    <GameColumn
      chrome={view.chrome}
      venue="turf"
      heading={view.heading}
      bug={
        <ScoreBug label={bug.label} size="sm">
          <ScoreBug.Name>{bug.name}</ScoreBug.Name>
          <ScoreBug.Cell>{bug.score}</ScoreBug.Cell>
          <ScoreBug.Meta>{bug.metaPhone}</ScoreBug.Meta>
        </ScoreBug>
      }
      reveal={latest ? <RevealChip key={view.bowled} {...latest} /> : null}
      field={
        <div aria-hidden="true" className="absolute top-0 left-1/2 h-211 w-97.5 -translate-x-1/2">
          <TracerPath d={TRACER.column.d} viewBox={TRACER.column.viewBox} size="column" />
          <TrackingRing who="yash" size="column" className="top-53.5 left-43" />
          <PlayerTag
            live={false}
            className="absolute top-53 left-55 px-1.75 py-1 whitespace-nowrap"
          >
            {view.tagPhone}
          </PlayerTag>
          <span
            ref={ballRef}
            data-part="ball"
            className="absolute top-0 left-0 -mt-1.5 -ml-1.5 size-3 rounded-full bg-floodlight opacity-0 will-change-transform"
          />
          {call ? (
            <CallOverlay
              key={view.bowled}
              call={call.text}
              tone={call.tone}
              size="column"
              className="absolute inset-x-0 top-70"
            />
          ) : null}
        </div>
      }
      thumb={
        phase === "end" && end ? (
          <GameEnd
            size="column"
            primary={end.primary}
            claim={end.claim}
            again={end.again ? { label: end.again, onClick: onAgain } : undefined}
          />
        ) : reduced ? null : (
          <>
            <TimingMeter size="column" zones={view.meter.zones.column} />
            <MonoLabel variant="mono-chip" tone="label" className="text-center text-balance">
              {view.bowl.hint}
            </MonoLabel>
            <Button
              size="tap"
              skew={false}
              glow={false}
              aria-disabled={phase !== "ready"}
              onClick={onBowl}
            >
              {view.bowl.labelPhone}
            </Button>
          </>
        )
      }
    />
  );
}
