import type { Ref } from "react";
import {
  AimZone,
  AttributeToast,
  GAME_STAGE_VIEW,
  Glass,
  MonoLabel,
  PlayerTag,
  PowerMeter,
  ScoreBug,
  Spotlight,
  ShuttleMark,
  Text,
  TracerPath,
  TrackingRing,
} from "@/design-system";
import { GameEnd } from "../frame/GameEnd";
import { GameStage } from "../frame/GameStage";
import { GameLoader } from "../three/GameLoader";
import type { Dir } from "./3d/match";
import type { BadmintonThree } from "./BadmintonPage";
import { ARC, PARKED } from "./flight";
import { HoldButton } from "./HoldButton";
import type { Badminton3dPhase, BadmintonPhase, BadmintonView } from "./view";

/**
 * Badminton from 1200px (Badminton-Play, 1440×900): you serve from the near end, Yash reads you from the far one. The
 * power meter and its HOLD · RELEASE button are on the left, the attribute toasts on the right; the shuttle flies the
 * arc between the two rings. Every part is at its board coordinate. `reduced` has no live game, so no meter and no hold.
 *
 * With `three` (the 3D game): the scene replaces the backdrop once it is ready, and the 2D art, rings, tag, tracer,
 * meter and hold are not drawn. The left panel tells you how to play; the two pick buttons sit together low in the
 * centre with the hint under them (while the 3D loads, the loader holds their place); Yash's smash speed shows in
 * tennis's serving-line spot while it is called. The toasts stay on the right.
 */
export function BadmintonStage({
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
  const { bug, spotlight, end, hold, meter } = view;
  const ready = three?.status === "ready";
  return (
    <GameStage
      chrome={view.chrome}
      venue="hall"
      scene={three?.scene}
      sceneHidden={!ready}
      sceneDrawn={three?.drawn}
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

      {three ? (
        three.parts.speed ? (
          // Yash's smash on the speed gun, in tennis's serving-line spot, while its call is up.
          <PlayerTag className="absolute top-37 left-1/2 z-6 -translate-x-1/2 whitespace-nowrap">
            {three.parts.speed}
          </PlayerTag>
        ) : null
      ) : (
        <div aria-hidden="true" className="absolute inset-0">
          <TracerPath d={ARC.d} viewBox={GAME_STAGE_VIEW} size="stage">
            <g ref={shuttleRef}>
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
      )}

      {three ? (
        // The power meter's place: how to play, in the style of tennis's instructions panel.
        <Glass
          as="section"
          pad="md"
          data-part="how"
          className="absolute top-30 left-9 z-6 flex w-62.5 flex-col gap-3"
        >
          <MonoLabel variant="mono-label" tone="label">
            {three.parts.progress}
          </MonoLabel>
          <Text as="p" variant="body-sm" tone="body" leading="font">
            {three.parts.how} <span className="font-mono text-volt">{three.parts.keys}</span>
          </Text>
        </Glass>
      ) : reduced ? null : (
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

      {three && !(phase === "end" && end) ? (
        // The two buttons' place (60 tall), held by the loader while the 3D loads, so nothing moves when they appear.
        <>
          <div className="absolute inset-x-0 bottom-39.5 z-6 flex h-15 items-center justify-center gap-3">
            {ready ? (
              three.parts.aims.map((aim) => (
                <AimZone
                  key={aim.dir}
                  label={aim.label}
                  name={aim.name}
                  open={aim.open}
                  disabled={!three.live}
                  onPick={() => onPick(aim.dir)}
                />
              ))
            ) : (
              <GameLoader label={three.parts.loading} progress={three.progress} size="stage" />
            )}
          </div>
          <MonoLabel
            aria-hidden="true"
            variant="mono-label"
            tone="label"
            className="absolute inset-x-0 bottom-31 z-6 text-center whitespace-nowrap"
          >
            {three.parts.hint.stage}
          </MonoLabel>
        </>
      ) : null}

      <div data-part="toasts" className="absolute top-30 right-9 z-6 flex w-85 flex-col gap-2.5">
        {view.toasts.map((toast, i) => (
          // A group flipping from next to charged is a new toast: it slides in. The others stay as they are.
          <AttributeToast key={`${i}-${toast.state}`} {...toast} />
        ))}
      </div>

      {spotlight ? (
        <Spotlight
          key={view.played}
          spotlight={spotlight}
          size="stage"
          // The field between the panels (x 306 to 1044): a long call wraps there, over the court, never onto a panel.
          className="absolute top-82 left-76.5 z-6 w-184.5 [--spot-y:-24vh]"
        />
      ) : null}

      {phase === "end" && end ? (
        <div className="absolute inset-x-0 top-152.5 z-7 flex justify-center">
          <GameEnd size="stage" end={end} onAgain={onAgain} />
        </div>
      ) : null}
    </GameStage>
  );
}
