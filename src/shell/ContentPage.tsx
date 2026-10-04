import { useEffect, type ReactNode } from "react";
import { ui, type RouteKey } from "@/content";
import {
  Breadcrumb,
  Button,
  ContentLayout,
  HUD,
  HUDButton,
  PageTitle,
  SkyGlow,
  VenueGlow,
} from "@/design-system";
import { ArenaLink } from "./ArenaLink";
import { ArenaTabBar } from "./ArenaTabBar";
import { CommentarySlot, useCommentary } from "./commentary";
import { QuickViewChip } from "./QuickViewChip";
import { ROUTES } from "./routes";

/** An elliptical glow, in the artboard's terms: centre (x, y), size (w, h) as a share of the page, opacity. */
export interface GlowSpec {
  x: string;
  y: string;
  w: string;
  h: string;
  alpha: number;
}

export interface ContentPageProps {
  /** The h1 is `ui.routes[route].heading`; the breadcrumb trail ends with it. */
  route: RouteKey;
  /** Sets `data-venue` on the page root (tints the venue glow). Undefined: no venue glow. */
  venue?: "turf" | "court" | "hall";
  /** Middle crumbs between the hub and the page, e.g. `[ui.venues.cricket]`. */
  trail: string[];
  eyebrow: ReactNode;
  eyebrowTone?: "volt" | "gold";
  /** Right slot of the title row (stat tiles, a legend, a line of text). */
  aside?: ReactNode;
  /** Route path for REMATCH. Leave out on pages without it. */
  rematch?: string;
  /** The skewed button at the bottom right (full width, square on the phone). The arrow is added here. */
  next?: { label: ReactNode; to: string };
  /** Said once on mount, interrupting any line on air. */
  comm?: string;
  /** Replaces the default sky + venue glows (trophy, card and team-up pages draw their own). */
  backdrop?: ReactNode;
  /** The top-of-page sky glow. Defaults to the venue's artboard values. */
  sky?: GlowSpec;
  /** The venue glow at the bottom edge. Defaults to the venue's artboard values. */
  glow?: GlowSpec;
  /** The panels. */
  children: ReactNode;
}

type Venue = NonNullable<ContentPageProps["venue"]>;

/** The glows each venue's artboard draws (Cricket-Career, Tennis-Highlights, Badminton-Attributes). */
const VENUE_GLOWS: Record<Venue, { sky: GlowSpec; glow: GlowSpec }> = {
  turf: {
    sky: { x: "50%", y: "-10%", w: "60%", h: "40%", alpha: 0.14 },
    glow: { x: "50%", y: "115%", w: "80%", h: "50%", alpha: 0.4 },
  },
  court: {
    sky: { x: "50%", y: "-10%", w: "60%", h: "40%", alpha: 0.12 },
    glow: { x: "50%", y: "110%", w: "70%", h: "50%", alpha: 0.45 },
  },
  hall: {
    sky: { x: "50%", y: "-10%", w: "50%", h: "40%", alpha: 0.1 },
    glow: { x: "30%", y: "110%", w: "60%", h: "50%", alpha: 0.4 },
  },
};
/** A page with no venue still gets a sky. */
const NO_VENUE_SKY: GlowSpec = VENUE_GLOWS.turf.sky;

/**
 * The frame every content page shares: backdrop, HUD (breadcrumb, REMATCH, QUICK VIEW), title block,
 * the panels, the commentary + next-venue footer, and the phone's tab bar. The title, panels and footer are
 * the `main#main` landmark; the HUD is the banner and the tab bar follows the main.
 */
export function ContentPage({
  route,
  venue,
  trail,
  eyebrow,
  eyebrowTone,
  aside,
  rematch,
  next,
  comm,
  backdrop,
  sky,
  glow,
  children,
}: ContentPageProps) {
  const preset = venue ? VENUE_GLOWS[venue] : undefined;
  const { say } = useCommentary();
  useEffect(() => {
    if (comm) say(comm, { interrupt: true });
  }, [say, comm]);

  const heading = ui.routes[route].heading;

  return (
    <div data-venue={venue} className="relative bg-ground">
      <ContentLayout
        mainId="main"
        backdrop={
          backdrop ?? (
            <>
              <SkyGlow {...(sky ?? preset?.sky ?? NO_VENUE_SKY)} />
              {preset ? <VenueGlow {...(glow ?? preset.glow)} /> : null}
            </>
          )
        }
        header={
          <HUD
            // The phone artboards draw a 44px bar (the 16px above comes from the layout).
            className="max-md:h-11"
            left={
              <Breadcrumb
                as={ArenaLink}
                to={ROUTES.arena}
                mark={ui.brand.mark}
                hubLabel={ui.placeholder.hub}
                label={ui.pages.breadcrumb}
                trail={[...trail, heading]}
              />
            }
            right={
              <>
                {rematch ? (
                  <HUDButton as={ArenaLink} to={rematch} className="max-md:hidden">
                    {ui.hud.rematch}
                  </HUDButton>
                ) : null}
                <QuickViewChip tone="glass-line" />
              </>
            }
          />
        }
        title={
          <PageTitle eyebrow={eyebrow} eyebrowTone={eyebrowTone} title={heading} aside={aside} />
        }
        footer={
          <>
            {/* min-w-0: the line wraps or shrinks before the button does (the button never shrinks). */}
            <CommentarySlot tag={ui.comm.tag} className="min-w-0" />
            {next ? (
              <Button
                as={ArenaLink}
                to={next.to}
                size="s"
                skew="desktop"
                className="ml-auto max-md:ml-0"
              >
                {/* One run of text, so the arrow follows the label with a plain space as the artboard sets it. */}
                <span>
                  {next.label} <span aria-hidden="true">{ui.glyph.next}</span>
                </span>
              </Button>
            ) : null}
          </>
        }
        tabBar={<ArenaTabBar />}
      >
        {children}
      </ContentLayout>
    </div>
  );
}
