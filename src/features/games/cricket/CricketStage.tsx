import type { Ref } from "react";
import {
  BallTracker,
  Glass,
  Heading,
  MonoLabel,
  PlayerTag,
  RevealList,
  ScoreBug,
  Spotlight,
  Text,
  TimingMeter,
  TracerPath,
  TrackingRing,
} from "@/design-system";
import { cn } from "@/lib/cn";
import { GameEnd } from "../frame/GameEnd";
import { GameStage } from "../frame/GameStage";
import { GameLoader } from "../three/GameLoader";
import { BowlButton } from "./BowlButton";
import type { CricketThree } from "./CricketPage";
import { TRACER } from "./flight";
import { LinePicker } from "./LinePicker";
import type { CricketPhase, CricketView } from "./view";

/**
 * Cricket from 1200px (Cricket-Play, 1440×900): you bowl from the near end, Yash bats at the far one. The over and
 * the STADIUM SCREEN flank the pitch; the length meter and the BOWL button (or the end) sit below it.
 * Every part is at its board coordinate. `reduced` has no live game, so no meter and no BOWL.
 *
 * With `three` (the 3D game): while it loads, the board as always with the loader in place of the meter and BOWL;
 * once it is ready, the scene replaces the backdrop and the drawn marks, and the line picker and the speed gun join
 * the meter and BOWL.
 */
export function CricketStage({
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
  const { bug, spotlight, end } = view;
  const ready = three?.status === "ready";
  return (
    <GameStage
      chrome={view.chrome}
      venue="turf"
      scene={three?.scene}
      sceneHidden={!ready}
      sceneDrawn={three?.drawn}
      bug={
        <ScoreBug label={bug.label} size="md">
          <ScoreBug.Name>{bug.name}</ScoreBug.Name>
          <ScoreBug.Cell>{bug.score}</ScoreBug.Cell>
          <ScoreBug.Meta>{bug.meta}</ScoreBug.Meta>
          <ScoreBug.Away tone="panel">{bug.away}</ScoreBug.Away>
        </ScoreBug>
      }
    >
      {ready ? null : (
        <div aria-hidden="true" className="absolute inset-0">
          <TracerPath
            d={TRACER.stage.d}
            viewBox={TRACER.stage.viewBox}
            size="stage"
            bounce={TRACER.stage.bounce}
          />
          <MonoLabel
            variant="mono-tag"
            tone="volt"
            className="absolute top-86.5 left-190.5 whitespace-nowrap"
          >
            {view.pitch.yorker}
          </MonoLabel>
          <MonoLabel
            variant="mono-tag"
            tone="label"
            className="absolute top-94.5 left-191.5 whitespace-nowrap"
          >
            {view.pitch.good}
          </MonoLabel>
          <TrackingRing who="yash" size="stage" className="top-80.5 left-172.5" />
          <PlayerTag className="absolute top-61 left-162.5 whitespace-nowrap">
            {view.onStrike}
          </PlayerTag>
          <TrackingRing who="you" size="stage" className="top-207 left-169.5" />
          <MonoLabel
            variant="mono-tag"
            tone="primary"
            className="absolute top-207.5 left-190 whitespace-nowrap"
          >
            {view.youTag}
          </MonoLabel>
          <span
            ref={ballRef}
            data-part="ball"
            className="absolute top-0 left-0 -mt-1.5 -ml-1.5 size-3 rounded-full bg-floodlight opacity-0"
          />
        </div>
      )}

      <Glass
        as="section"
        pad="md"
        className="absolute top-27.5 left-9 z-5 flex w-75 flex-col gap-3.5"
      >
        <Heading level={1} variant="mono-label" tone="label">
          {view.heading}
        </Heading>
        <Text as="p" variant="title-game">
          {view.headline}
        </Text>
        <BallTracker balls={view.balls} />
        <Text as="p" variant="body-cell" tone="secondary">
          {three ? three.controls.how : view.how}
        </Text>
      </Glass>

      <RevealList
        title={view.screen.title}
        count={view.screen.count}
        slots={view.screen.slots}
        className="absolute top-27.5 right-9 z-5 w-90"
      />

      {spotlight ? (
        <Spotlight
          key={view.bowled}
          spotlight={spotlight}
          size="stage"
          className="absolute inset-x-0 top-105 z-6"
        />
      ) : null}

      {reduced && phase !== "end" ? null : (
        <div className="absolute inset-x-100 top-152.5 z-7 flex flex-col items-center gap-3.5">
          {three && !ready && phase !== "end" ? (
            <GameLoader label={three.controls.loading} progress={three.progress} size="stage" />
          ) : (
            <>
              {three ? (
                // The speed gun, just above the meter's right end, out of the flow: the block is as tall as the 2D one.
                <MonoLabel
                  data-part="speed"
                  variant="mono-label"
                  tone="primary"
                  className={cn(
                    "absolute right-0 bottom-full mb-2.5 whitespace-nowrap",
                    three.controls.speed ? "" : "invisible",
                  )}
                >
                  {three.controls.speed}
                </MonoLabel>
              ) : null}
              {reduced ? null : (
                <TimingMeter
                  size="stage"
                  labels={view.meter.labels}
                  zones={view.meter.zones.stage}
                />
              )}
              {phase === "end" && end ? (
                <GameEnd size="stage" end={end} onAgain={onAgain} />
              ) : reduced ? null : three ? (
                // BOWL on the board's centre line, the line picker beside it on the left, inside the meter's span.
                <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                  <LinePicker
                    lines={three.controls.lines}
                    disabled={phase !== "ready"}
                    onLine={three.onLine}
                    size="stage"
                    className="justify-self-end"
                  />
                  <BowlButton
                    size="m"
                    skew
                    pulse="ring"
                    glow={false}
                    disabled={phase !== "ready" && phase !== "runup"}
                    onBowl={onBowl}
                    // As wide as RELEASE · SPACE, so the picker beside it never moves when the label changes.
                    className="min-w-66 px-8 type-btn-xl"
                  >
                    {three.controls.bowl.label}
                  </BowlButton>
                </div>
              ) : (
                <BowlButton
                  size="m"
                  skew
                  pulse="ring"
                  glow={false}
                  disabled={phase !== "ready"}
                  onBowl={onBowl}
                  className="px-11 type-btn-xl"
                >
                  {view.bowl.label}
                </BowlButton>
              )}
            </>
          )}
        </div>
      )}
    </GameStage>
  );
}
