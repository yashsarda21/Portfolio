import type { Ref } from "react";
import {
  AimZone,
  CallOverlay,
  CourtsideCard,
  Glass,
  Heading,
  LEDMarquee,
  MonoLabel,
  PlayerTag,
  ScoreBug,
  Text,
  TracerPath,
  TrackingRing,
} from "@/design-system";
import { cn } from "@/lib/cn";
import { GameEnd } from "../frame/GameEnd";
import { GameStage } from "../frame/GameStage";
import { returnPath, SERVE, STAGE_VIEW } from "./flight";
import type { Side } from "./referee";
import { LIVE_PHASES, type TennisPhase, type TennisView } from "./view";

/**
 * Tennis from 1200px (Tennis-Play, 1440×900): Yash serves from the far baseline, you return from the near one. The
 * LED board is above the court, the two aim zones lie where the return will land, and each return turns a highlight
 * card in toward the court. Every part is at its board coordinate. `reduced` has no live game, so no zones to pick
 * and no tracer.
 */
export function TennisStage({
  view,
  phase,
  reduced,
  shot,
  onPick,
  onAgain,
  ballRef,
}: {
  view: TennisView;
  phase: TennisPhase;
  reduced: boolean;
  /** The side the last return was sent to: its line is drawn while the call is made. */
  shot: Side | null;
  onPick: (side: Side) => void;
  onAgain: () => void;
  ballRef?: Ref<SVGCircleElement>;
}) {
  const { bug, call, end, instructions, progress } = view;
  const live = LIVE_PHASES.includes(phase) && !reduced;
  const returning = shot !== null && (phase === "called" || phase === "verdict");
  return (
    <GameStage
      chrome={view.chrome}
      venue="court"
      bug={
        <ScoreBug label={bug.label} size="md">
          <ScoreBug.Name serving>{bug.name}</ScoreBug.Name>
          <ScoreBug.Cell pad="tight">{bug.yash}</ScoreBug.Cell>
          <ScoreBug.Cell pad="tight" muted>
            {bug.you}
          </ScoreBug.Cell>
          <ScoreBug.Away tone="line">{bug.away}</ScoreBug.Away>
          <ScoreBug.Status alert={bug.alert}>{bug.status}</ScoreBug.Status>
        </ScoreBug>
      }
    >
      <LEDMarquee items={view.marquee} className="absolute top-61.5 left-105" />

      <div aria-hidden="true" className="absolute inset-0">
        {reduced ? null : (
          <>
            {/* The serve is drawn by the game's clock: `--serve` is 0 at the hit and 1 at the end of the window. */}
            <TracerPath
              d={SERVE.d}
              viewBox={STAGE_VIEW}
              size="stage"
              draw={phase === "ready" ? 0 : 1}
              drawVar="--serve"
              bounce={SERVE.bounce}
            >
              <circle
                ref={ballRef}
                data-part="ball"
                r={6}
                opacity={0}
                className="fill-floodlight will-change-transform"
              />
            </TracerPath>
            {returning ? (
              <TracerPath
                key={view.returned}
                d={returnPath(shot)}
                viewBox={STAGE_VIEW}
                size="stage"
                drawVar={`--return-${shot}`}
              />
            ) : null}
          </>
        )}
        <TrackingRing who="yash" size="stage" className="top-83.5 left-185 h-3.5 w-14" />
        <PlayerTag className="absolute top-73.5 left-201.5 whitespace-nowrap">
          {view.serving}
        </PlayerTag>
      </div>

      {view.aims.map((aim) =>
        reduced ? null : (
          <AimZone
            key={aim.side}
            label={aim.label}
            name={aim.name}
            open={aim.open}
            disabled={!live}
            onPick={() => onPick(aim.side)}
            className={cn(
              "absolute top-86.5 z-5",
              aim.side === "left" ? "left-143.75" : "left-181",
            )}
          />
        ),
      )}

      {view.cards.map((card, i) => (
        <CourtsideCard
          key={i}
          {...card}
          className={cn("absolute top-95", card.side === "left" ? "left-10" : "right-10")}
        />
      ))}

      <Glass className="absolute top-24 left-1/2 z-6 flex -translate-x-1/2 items-center gap-4.5 px-4.5 py-2.5">
        <Heading level={1} variant="mono-label" tone="label" className="whitespace-nowrap">
          {instructions.title}
        </Heading>
        <Text as="p" variant="body-sm" tone="body" leading="font" className="whitespace-nowrap">
          {instructions.how} <span className="font-mono text-volt">{instructions.keys}</span>{" "}
          {instructions.tap}
        </Text>
      </Glass>

      <div
        aria-hidden="true"
        className="absolute bottom-27.5 left-1/2 z-6 flex -translate-x-1/2 flex-col items-center gap-2.5"
      >
        <MonoLabel variant="mono-label" tone="label" className="whitespace-nowrap">
          {progress.label}
        </MonoLabel>
        <div className="flex gap-1.5">
          {progress.bars.map((bar, i) => (
            <span
              key={i}
              data-state={bar}
              className={cn("h-1.5 w-21", bar === "done" ? "bg-volt" : "bg-volt-a35")}
            />
          ))}
        </div>
      </div>

      {call ? (
        <CallOverlay
          key={view.returned}
          call={call.text}
          tone={call.tone}
          size="stage"
          className="absolute inset-x-0 top-105 z-6"
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
