import type { ComponentProps } from "react";
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
} from "@/design-system";
import { ArenaLink } from "@/shell/ArenaLink";
import { useAudio } from "@/shell/audio";
import { CommentarySlot } from "@/shell/commentary";
import { QuickViewChip } from "@/shell/QuickViewChip";
import { HubIndex } from "./HubIndex";
import type { HubView } from "./view";

/** PLAY and REMATCH push into the venue (spec §4.6); every other link takes the wipe. */
function TunnelLink(props: ComponentProps<typeof ArenaLink>) {
  return <ArenaLink {...props} transition="tunnel" />;
}

/** Where each card sits on the arc, left to right: the outer two turn in, the middle one stands 14px higher. */
const ARC = ["[--arc-ry:10deg]", "[--arc-y:-14px]", "[--arc-ry:-10deg]"] as const;

/**
 * The desktop Hub, from 1200px: every part at its place on the 1440×900 artboard. `ready` is false until the
 * saved match record has loaded; the parts that depend on it are hidden until then (H5), so a returning
 * visitor never sees the fresh state flash by.
 */
export function HubStage({ view, ready }: { view: HubView; ready: boolean }) {
  const audio = useAudio();
  const pending = ready ? {} : { "data-record-pending": "" };

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
      <div
        data-orbit="rest"
        {...pending}
        className="absolute top-51.5 right-9 left-76 grid h-110 grid-cols-3 gap-7 perspective-arc"
      >
        {view.venues.map((venue, i) => (
          <VenueCard
            key={venue.key}
            scene={venue.scene}
            played={venue.played}
            number={venue.number}
            name={venue.name}
            status={venue.status}
            blurb={venue.blurb}
            reveals={venue.reveals}
            play={{ label: venue.play.label, as: TunnelLink, to: venue.play.to }}
            skip={{ label: venue.skip.label, as: ArenaLink, to: venue.skip.to }}
            slotClassName={ARC[i]}
          />
        ))}
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
      <KeyboardHint className="absolute right-9 bottom-12">{view.hint}</KeyboardHint>
    </Stage>
  );
}
