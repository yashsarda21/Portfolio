import { cn } from "@/lib/cn";
import { linkProps, type LinkSpec } from "../lib/link";
import { Glass } from "../primitives/Glass";
import { Icon } from "../primitives/Icon";
import { Heading, MonoLabel } from "../primitives/Text";
import type { VenueSurfaceProps } from "./VenueCard";

/** One cell of the action bar: 48px, square. The focus ring runs inside so the neighbour does not cover it. */
function ActionCell({
  spec,
  className,
  arrow,
}: {
  spec: LinkSpec;
  className: string;
  arrow?: boolean;
}) {
  const { as: Comp, ...attrs } = linkProps(spec);
  return (
    <Comp
      className={cn(
        "flex h-12 items-center justify-center focus-visible:-outline-offset-4",
        className,
      )}
      {...attrs}
    >
      {spec.label}
      {arrow ? <Icon name="arrow-right" size={12} /> : null}
    </Comp>
  );
}

interface VenueFixtureProps extends VenueSurfaceProps {
  /** "VENUE 01 · CAREER" */
  meta: string;
}

/** The phone's venue card (Mobile-Hub): the venue's colour washes in from the left, with PLAY and SKIP in a bar beneath. */
export function VenueFixture({
  scene,
  meta,
  status,
  played,
  name,
  play,
  skip,
  className,
  tiltRef,
  ...rest
}: VenueFixtureProps) {
  return (
    <Glass
      as="article"
      surface="none"
      edge={played ? "volt" : "none"}
      data-state={played ? "played" : "unplayed"}
      data-venue={scene}
      ref={tiltRef}
      className={cn("flex flex-col border fixture-wash", !played && "border-line", className)}
      {...rest}
    >
      <div className="flex flex-col gap-1 px-4 py-3.5">
        <div className="flex justify-between">
          <MonoLabel variant="mono-round">{meta}</MonoLabel>
          <MonoLabel variant="mono-round" tone={played ? "volt" : "label"}>
            {status}
          </MonoLabel>
        </div>
        <Heading level={2} variant="title-fixture">
          {name}
        </Heading>
      </div>
      <div className="grid grid-cols-2 border-t border-line">
        <ActionCell
          spec={play}
          className="bg-volt type-btn-xs text-volt-ink transition-colors duration-(--dur-snap) ease-snap hover:bg-volt-hover"
        />
        <ActionCell
          spec={skip}
          className="gap-2 type-mono-xs text-floodlight transition-colors duration-(--dur-snap) ease-snap hover:text-volt"
          arrow
        />
      </div>
    </Glass>
  );
}
