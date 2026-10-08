import {
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  BrandLockup,
  Drawer,
  FacilityTile,
  HUDButton,
  Heading,
  MonoLabel,
  SkyGlow,
  VenueFixture,
  useTilt,
} from "@/design-system";
import { MEDIA } from "@/lib/breakpoints";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { ArenaLink, TunnelLink } from "@/shell/ArenaLink";
import { QuickViewChip } from "@/shell/QuickViewChip";
import { HubIndex } from "./HubIndex";
import type { HubView } from "./view";

type Venue = HubView["venues"][number];

/** One part of the list rising in, after the one before it (60ms apart, spec H9). */
function Rise({
  at,
  className,
  children,
  ...rest
}: {
  at: number;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "className" | "children" | "style">) {
  return (
    <div
      {...rest}
      className={cn("animate-rise-stagger", className)}
      style={{ "--i": at } as CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * One fixture: it rises in on its turn, and a finger pressing it tilts it up to 6° toward the finger and presses it
 * in. It eases back on release, and a scroll that takes the touch over cancels it. The rise and the press are on the
 * layer around the card (the rise's end frame would otherwise hold the card's own transform still). A drag that ends on a link never
 * opens it; a tap does.
 */
function Fixture({ venue, at }: { venue: Venue; at: number }) {
  const ref = useRef<HTMLElement>(null);
  const tilt = useTilt(ref, { max: 6, lift: 0, touch: true });
  const cancelDrag = (e: { preventDefault: () => void }) => {
    if (tilt.consumeDrag()) e.preventDefault();
  };
  return (
    <Rise at={at} className="fixture-press perspective-card" {...tilt.handlers}>
      <VenueFixture
        tiltRef={ref}
        scene={venue.scene}
        meta={venue.meta}
        status={venue.statusPhone}
        played={venue.played}
        name={venue.name}
        play={{
          label: venue.play.label,
          as: TunnelLink,
          to: venue.play.to,
          onClick: cancelDrag,
          draggable: false,
        }}
        skip={{
          label: venue.skip.labelPhone,
          as: ArenaLink,
          to: venue.skip.to,
          onClick: cancelDrag,
          draggable: false,
        }}
        className="touch-pan-y"
      />
    </Rise>
  );
}

/**
 * The Hub below 1200px (Mobile-Hub; centred and a size step up on a tablet, H1): the day's fixtures as a list, the
 * facilities in pairs, the main tab bar under a phone's thumb, and the full index in a drawer (H2). No design
 * space: it is plain flow, so a short phone scrolls. `ready` is false until the saved match record has loaded;
 * the parts that depend on it wait (H5). Silent: no commentary, no keyboard hint.
 */
export function HubColumn({ view, ready }: { view: HubView; ready: boolean }) {
  const [open, setOpen] = useState(false);
  const drawerId = useId();
  // The stage takes over from 1200px: a drawer left open is closed with it, so the stage is never held inert.
  const onStage = useMediaQuery(MEDIA.lg);
  const pending = ready ? {} : { "data-record-pending": "" };
  // Growing into the stage closes the drawer for good: shrinking back must not open it again by itself.
  const [wasOnStage, setWasOnStage] = useState(onStage);
  if (onStage !== wasOnStage) {
    setWasOnStage(onStage);
    if (onStage) setOpen(false);
  }

  return (
    <div data-hub-column="" className="relative min-h-dvh bg-night lg:hidden">
      <SkyGlow w="100%" h="30%" alpha={0.14} />
      <div className="relative mx-auto w-full max-w-160 px-4 pt-4 tabbar-clearance md:pb-10">
        <div className="flex items-center justify-between">
          <BrandLockup mark={view.brand.mark} size="sm" />
          <div className="flex items-center gap-2">
            <HUDButton
              tone="glass-line"
              aria-haspopup="dialog"
              aria-expanded={open && !onStage}
              aria-controls={drawerId}
              onClick={() => setOpen(true)}
            >
              {view.drawer.open}
            </HUDButton>
            <QuickViewChip tone="glass-line" />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-1">
          <MonoLabel variant="mono-label" tone="volt" leading="font" {...pending}>
            {view.fixtures}
          </MonoLabel>
          <Heading level={1}>{view.heading}</Heading>
        </div>
        <div className="mt-0.5 flex flex-col gap-3 md:mt-4">
          <div {...pending} className="flex flex-col gap-3">
            {view.venues.map((venue, i) => (
              <Fixture key={venue.key} venue={venue} at={i} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {view.facilitiesPhone.map((facility, i) => (
              <Rise key={facility.key} at={view.venues.length + i}>
                <FacilityTile
                  as={ArenaLink}
                  to={facility.to}
                  label={facility.label}
                  title={facility.title}
                  tone={facility.tone}
                  size="sm"
                />
              </Rise>
            ))}
          </div>
        </div>
      </div>
      <Drawer
        id={drawerId}
        open={open && !onStage}
        onClose={() => setOpen(false)}
        label={view.index.label}
        closeLabel={view.drawer.close}
      >
        <div {...pending} className="flex grow flex-col">
          <HubIndex view={view} inDrawer onNavigate={() => setOpen(false)} />
        </div>
      </Drawer>
    </div>
  );
}
