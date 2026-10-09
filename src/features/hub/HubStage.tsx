import { useRef, type MouseEvent } from "react";
import {
  ArenaBackdrop,
  AudioToggle,
  BrandLockup,
  FacilityTile,
  Glass,
  HUD,
  Heading,
  KeyboardHint,
  MonoLabel,
  RecordChip,
  Stage,
  VenueCard,
  useOrbit,
  useTilt,
} from "@/design-system";
import { cn } from "@/lib/cn";
import { MEDIA } from "@/lib/breakpoints";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { ArenaLink, TunnelLink } from "@/shell/ArenaLink";
import { useAudio } from "@/shell/audio";
import { CommentarySlot } from "@/shell/commentary";
import { QuickViewChip } from "@/shell/QuickViewChip";
import { HubIndex } from "./HubIndex";
import { hubHint, type HubView } from "./view";

type Venue = HubView["venues"][number];

/** Read after the page loads, like MEDIA.reducedMotion; until then both are false, so the prerendered hint shows everything (as the artboard). */
const TOUCH_ONLY = "(pointer: coarse) and (not (any-pointer: fine))";

/** Where each card sits on the arc, left to right: the outer two turn in, the middle one stands 14px higher. */
const ARC = ["[--arc-ry:10deg]", "[--arc-y:-14px]", "[--arc-ry:-10deg]"] as const;

/**
 * One card on the arc: it leans up to 6° toward the pointer, or toward a finger while one presses it (the slot's CSS
 * does the lift, so the tilt adds none). The pointer is read on the slot, not on the card that turns. A drag that ends on a link, or that turned the arc, never opens it.
 */
function ArcCard({
  venue,
  arc,
  live,
  swallowedByOrbit,
}: {
  venue: Venue;
  arc: string;
  live: boolean;
  swallowedByOrbit: () => boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const tilt = useTilt(ref, { max: 6, lift: 0, touch: true });
  // Both are asked, so neither keeps a stale drag for the next click.
  const cancelDrag = (e: MouseEvent) => {
    const turned = swallowedByOrbit();
    const dragged = tilt.consumeDrag();
    if (turned || dragged) e.preventDefault();
  };
  return (
    <VenueCard
      tiltRef={ref}
      scene={venue.scene}
      played={venue.played}
      number={venue.number}
      name={venue.name}
      status={venue.status}
      blurb={venue.blurb}
      reveals={venue.reveals}
      play={{
        label: venue.play.label,
        as: TunnelLink,
        to: venue.play.to,
        onClick: cancelDrag,
        draggable: false,
      }}
      skip={{
        label: venue.skip.label,
        as: ArenaLink,
        to: venue.skip.to,
        onClick: cancelDrag,
        draggable: false,
      }}
      slotClassName={cn("pointer-events-auto perspective-card", arc)}
      slotProps={live ? tilt.handlers : {}}
    />
  );
}

/**
 * The desktop Hub, from 1200px: every part at its place on the 1440×900 artboard. `ready` is false until the
 * saved match record has loaded; the parts that depend on it are hidden until then (H5), so a returning
 * visitor never sees the fresh state flash by.
 */
export function HubStage({ view, ready }: { view: HubView; ready: boolean }) {
  const audio = useAudio();
  const pending = ready ? {} : { "data-record-pending": "" };
  const live = useMediaQuery(MEDIA.lg);
  const plate = useRef<HTMLDivElement>(null);
  const { consumeDrag, ...orbitHandlers } = useOrbit(plate, { enabled: live });
  const hint = hubHint(view.hint, {
    reducedMotion: useMediaQuery(MEDIA.reducedMotion),
    touchOnly: useMediaQuery(TOUCH_ONLY),
  });

  return (
    <Stage from="lg" backdrop={<ArenaBackdrop layout="hub" bleed />}>
      <HUD
        className="absolute inset-x-0 top-0 z-10"
        left={
          <BrandLockup
            as={ArenaLink}
            to={view.brand.to}
            mark={view.brand.mark}
            label={view.brand.label}
          />
        }
        center={
          <MonoLabel variant="mono-eyebrow" tone="primary">
            {view.hud}
          </MonoLabel>
        }
        right={
          <>
            <RecordChip label={view.record.label} value={view.record.value} {...pending} />
            <QuickViewChip />
            <AudioToggle
              variant="icon"
              name={view.audio.name}
              on={audio.enabled}
              onToggle={audio.toggle}
            />
          </>
        }
      />
      <Glass
        as="aside"
        {...pending}
        className="absolute top-26 bottom-9 left-9 z-5 flex w-59 flex-col px-4.5 py-5"
      >
        <HubIndex view={view} />
      </Glass>
      <div className="absolute top-26 right-9 left-76 flex flex-col gap-1.5">
        <MonoLabel variant="mono-eyebrow" tone="volt">
          {view.eyebrow}
        </MonoLabel>
        <Heading level={1} variant="title-hub">
          {view.heading}
        </Heading>
      </div>
      {/* The arc stands in a still frame that takes the pointer; inside it the plate turns. The plate lets every press
          fall through to the cards (it shares their 3D space, and its own flat box would otherwise cut across the
          turned cards and steal their clicks). */}
      <div
        {...(live ? orbitHandlers : {})}
        className="absolute top-51.5 right-9 left-76 h-110 touch-pan-y select-none perspective-arc"
      >
        <div
          ref={plate}
          data-orbit="rest"
          {...pending}
          className="pointer-events-none grid size-full grid-cols-3 gap-7 transform-3d"
        >
          {view.venues.map((venue, i) => (
            <ArcCard
              key={venue.key}
              venue={venue}
              arc={ARC[i] ?? ""}
              live={live}
              swallowedByOrbit={consumeDrag}
            />
          ))}
        </div>
      </div>
      <div className="absolute top-168 right-9 left-76 grid grid-cols-4 gap-4">
        {view.facilities.map((facility) => (
          <FacilityTile
            key={facility.key}
            as={ArenaLink}
            to={facility.to}
            label={facility.label}
            title={facility.title}
            tone={facility.tone}
            size="lg"
          />
        ))}
      </div>
      <CommentarySlot tag={view.commTag} className="absolute bottom-9 left-76" />
      {hint ? <KeyboardHint className="absolute right-9 bottom-12">{hint}</KeyboardHint> : null}
    </Stage>
  );
}
