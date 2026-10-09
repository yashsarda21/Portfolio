import type { Ref } from "react";
import {
  BallTracker,
  Button,
  CallOverlay,
  Glass,
  Heading,
  MonoLabel,
  PlayerTag,
  RevealList,
  ScoreBug,
  Text,
  TimingMeter,
  TracerPath,
  TrackingRing,
} from "@/design-system";
import { GameEnd } from "../frame/GameEnd";
import { GameStage } from "../frame/GameStage";
import { TRACER } from "./flight";
import type { CricketPhase, CricketView } from "./view";

/**
 * Cricket from 1200px (Cricket-Play, 1440×900): you bowl from the near end, Yash bats at the far one. The over and
 * the STADIUM SCREEN flank the pitch; the length meter and the BOWL button (or the end) sit below it.
 * Every part is at its board coordinate. `reduced` has no live game, so no meter and no BOWL.
 */
export function CricketStage({
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
  const { bug, call, end } = view;
  return (
    <GameStage
      chrome={view.chrome}
      venue="turf"
      bug={
        <ScoreBug label={bug.label} size="md">
          <ScoreBug.Name>{bug.name}</ScoreBug.Name>
          <ScoreBug.Cell>{bug.score}</ScoreBug.Cell>
          <ScoreBug.Meta>{bug.meta}</ScoreBug.Meta>
          <ScoreBug.Away tone="panel">{bug.away}</ScoreBug.Away>
        </ScoreBug>
      }
    >
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
          className="absolute top-0 left-0 -mt-1.5 -ml-1.5 size-3 rounded-full bg-floodlight opacity-0 will-change-transform"
        />
      </div>

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
          {view.how}
        </Text>
      </Glass>

      <RevealList
        title={view.screen.title}
        count={view.screen.count}
        slots={view.screen.slots}
        className="absolute top-27.5 right-9 z-5 w-90"
      />

      {call ? (
        <CallOverlay
          key={view.bowled}
          call={call.text}
          tone={call.tone}
          size="stage"
          className="absolute inset-x-0 top-105 z-6"
        />
      ) : null}

      {reduced && phase !== "end" ? null : (
        <div className="absolute inset-x-100 top-152.5 z-7 flex flex-col items-center gap-3.5">
          {reduced ? null : (
            <TimingMeter size="stage" labels={view.meter.labels} zones={view.meter.zones.stage} />
          )}
          {phase === "end" && end ? (
            <GameEnd
              size="stage"
              primary={end.primary}
              claim={end.claim}
              again={end.again ? { label: end.again, onClick: onAgain } : undefined}
            />
          ) : reduced ? null : (
            <Button
              size="m"
              skew
              pulse="ring"
              glow={false}
              aria-disabled={phase !== "ready"}
              onClick={onBowl}
              className="px-11 type-btn-xl"
            >
              {view.bowl.label}
            </Button>
          )}
        </div>
      )}
    </GameStage>
  );
}
