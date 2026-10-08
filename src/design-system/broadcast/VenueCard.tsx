import type { ComponentPropsWithoutRef, Ref } from "react";
import { cn } from "@/lib/cn";
import { linkProps, type LinkSpec } from "../lib/link";
import { Button } from "../primitives/Button";
import { Glass } from "../primitives/Glass";
import { Heading, MonoLabel, Text } from "../primitives/Text";
import { VenueArt } from "../scene/VenueArt";
import { SkipChip } from "./SkipChip";

/** What a venue card and a phone fixture share: the picture's scene, the played state, the name, the two actions. */
export interface VenueSurfaceProps extends Omit<
  ComponentPropsWithoutRef<"article">,
  "title" | "children"
> {
  scene: "turf" | "court" | "hall";
  played: boolean;
  name: string;
  status: string;
  play: LinkSpec;
  skip: LinkSpec;
  /** The tilting layer: the page's pointer handlers move it. */
  tiltRef?: Ref<HTMLElement>;
}

interface VenueCardProps extends VenueSurfaceProps {
  /** "VENUE 01" */
  number: string;
  blurb: string;
  reveals: string;
  headingLevel?: 2 | 3;
  /** The arc: the page sets --arc-y and --arc-ry here (the card does not know where it sits). */
  slotClassName?: string;
}

/**
 * A Hub venue card: the venue's picture, what it is, and PLAY / SKIP. The slot holds the page's arc transform and
 * lifts on hover or keyboard focus; the card inside takes the pointer tilt. Every word is a prop.
 */
export function VenueCard({
  scene,
  number,
  status,
  played,
  name,
  blurb,
  reveals,
  play,
  skip,
  headingLevel = 2,
  className,
  slotClassName,
  tiltRef,
  ...rest
}: VenueCardProps) {
  return (
    <div className={cn("group/venue h-full venue-slot", slotClassName)}>
      <Glass
        as="article"
        edge={played ? "volt-soft" : "none"}
        data-state={played ? "played" : "unplayed"}
        ref={tiltRef}
        className={cn(
          "flex h-full flex-col overflow-hidden transition-colors duration-(--dur-hover) group-hover/venue:border-volt-a60 group-has-focus-visible/venue:border-volt-a60",
          className,
        )}
        {...rest}
      >
        <VenueArt scene={scene} />
        <div className="flex grow flex-col gap-2 px-5 py-4.5">
          <div className="flex justify-between">
            <MonoLabel>{number}</MonoLabel>
            <MonoLabel variant="mono-xs" tone={played ? "volt" : "label"}>
              {status}
            </MonoLabel>
          </div>
          <Heading level={headingLevel} variant="d3">
            {name}
          </Heading>
          <Text as="p" variant="body-md" tone="secondary">
            {blurb}
          </Text>
          <MonoLabel variant="mono-xs" tone="dim">
            {reveals}
          </MonoLabel>
          <div className="mt-auto flex gap-2.5">
            <Button size="card" skew={false} glow={false} className="grow" {...linkProps(play)}>
              {play.label}
            </Button>
            <SkipChip variant="hub" {...linkProps(skip)}>
              {skip.label}
            </SkipChip>
          </div>
        </div>
      </Glass>
    </div>
  );
}
