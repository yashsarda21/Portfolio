import type { Ref } from "react";
import {
  CallOverlay,
  MonoLabel,
  PlayerTag,
  RevealChip,
  ScoreBug,
  TimingMeter,
  TracerPath,
  TrackingRing,
} from "@/design-system";
import { cn } from "@/lib/cn";
import { GameColumn } from "../frame/GameColumn";
import { GameEnd } from "../frame/GameEnd";
import { GameLoader } from "../three/GameLoader";
import { BowlButton } from "./BowlButton";
import type { CricketThree } from "./CricketPage";
import { TRACER } from "./flight";
import { LinePicker } from "./LinePicker";
import type { CricketPhase, CricketView } from "./view";

/**
 * Cricket below 1200px (Mobile-Game, 390×844): the pitch rises away from your thumb. The score is at the top with
 * SKIP, the newest innings in a chip, and the length meter and the TAP TO BOWL button under the thumb. The field
 * is drawn in the board's 390×844 space, centred, so the rings and the tracer sit on the pitch at any width. The
 * pitch's centre line is x 195 there: the ring (46 wide), the tracer's top and the ball all stand on it (D-9).
 *
 * With `three` (the 3D game): while it loads, the loader holds the thumb zone; once it is ready, the scene fills the
 * screen behind everything, only the call is drawn on the field, and the line picker and the speed gun join the thumb zone.
 */
export function CricketColumn({
  view,
  phase,
  reduced,
  onBowl,
  onAgain,
  ballRef,
  three,
}: {
  view: CricketView;
  phase: CricketPhase;
  reduced: boolean;
  onBowl: () => void;
  onAgain: () => void;
  ballRef?: Ref<HTMLSpanElement>;
  three?: CricketThree;
}) {
  const { bug, call, end, latest } = view;
  const ready = three?.status === "ready";
  const controls = (
    <>
      {three ? (
        <>
          <LinePicker
            lines={three.controls.lines}
            disabled={phase !== "ready"}
            onLine={three.onLine}
            size="column"
          />
          {/* The speed gun keeps its line while empty, so nothing moves when the first ball is bowled. */}
          <MonoLabel
            data-part="speed"
            variant="mono-chip"
            tone="primary"
            className={cn("block min-h-[1lh]", three.controls.speed ? "" : "invisible")}
          >
            {three.controls.speed}
          </MonoLabel>
        </>
      ) : null}
      <TimingMeter size="column" zones={view.meter.zones.column} />
      <MonoLabel
        data-part="hint"
        variant="mono-chip"
        tone="label"
        className="text-center text-balance"
      >
        {view.bowl.hint}
      </MonoLabel>
      <BowlButton
        size="tap"
        skew={false}
        glow={false}
        disabled={three ? phase !== "ready" && phase !== "runup" : phase !== "ready"}
        onBowl={onBowl}
      >
        {three ? three.controls.bowl.labelPhone : view.bowl.labelPhone}
      </BowlButton>
    </>
  );
  return (
    <GameColumn
      chrome={view.chrome}
      venue="turf"
      scene={three?.scene}
      sceneHidden={!ready}
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
          {ready ? null : (
            <>
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
                className="absolute top-0 left-0 -mt-1.5 -ml-1.5 size-3 rounded-full bg-floodlight opacity-0"
              />
            </>
          )}
          {call ? (
            <CallOverlay
              key={view.bowled}
              call={call.text}
              tone={call.tone}
              size="column"
              className="absolute inset-x-0 top-70 short:top-48"
            />
          ) : null}
        </div>
      }
      thumb={
        phase === "end" && end ? (
          <GameEnd size="column" end={end} onAgain={onAgain} />
        ) : reduced ? null : three && !ready ? (
          // While the 3D loads, the controls hold their place, unseen, with the loader over BOWL's: when they appear,
          // the thumb zone is already their height, so nothing moves.
          <div className="relative flex w-full flex-col items-center gap-4 short:gap-2">
            <div inert className="invisible flex w-full flex-col items-center gap-4 short:gap-2">
              {controls}
            </div>
            <div className="absolute inset-x-0 bottom-0">
              <GameLoader label={three.controls.loading} progress={three.progress} size="column" />
            </div>
          </div>
        ) : (
          controls
        )
      }
    />
  );
}
