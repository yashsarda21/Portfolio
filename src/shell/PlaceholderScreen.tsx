import { useEffect } from "react";
import { ui, type RouteKey } from "@/content";
import { BrandLockup, Glass, HUD, Heading, MonoLabel, Text } from "@/design-system";
import { ArenaLink } from "./ArenaLink";
import { CommentarySlot, useCommentary } from "./commentary";
import { QuickViewChip } from "./QuickViewChip";
import { ROUTES } from "./routes";

const MAP: RouteKey[] = [
  "home",
  "intro",
  "arena",
  "cricket",
  "tennis",
  "badminton",
  "career",
  "highlights",
  "attributes",
  "trophies",
  "card",
  "teamUp",
  "scout",
];

/** Short nav label when a route has one, else its heading. */
function routeLabel(key: RouteKey): string {
  const copy = ui.routes[key];
  return "navLabel" in copy ? copy.navLabel : copy.heading;
}

interface PlaceholderScreenProps {
  route: RouteKey;
  /** "div" when nested inside another page's <main> (e.g. the mobile half of the Landing preview). */
  as?: "main" | "div";
  /** Say the placeholder commentary line on mount. Off when the parent page owns commentary. */
  announce?: boolean;
}

/** Temporary page for routes built in later phases: shows the phase and the full site map. */
export function PlaceholderScreen({
  route,
  as: Root = "main",
  announce = true,
}: PlaceholderScreenProps) {
  const copy = ui.routes[route];
  const { say } = useCommentary();
  useEffect(() => {
    if (announce) say(ui.placeholder.comm, { interrupt: true });
  }, [say, announce]);

  return (
    <Root
      id={Root === "main" ? "main" : undefined}
      className="relative flex min-h-dvh flex-col bg-ground"
    >
      <HUD
        left={
          <BrandLockup
            as={ArenaLink}
            to={ROUTES.arena}
            mark={ui.brand.mark}
            label={ui.placeholder.hub}
          />
        }
        right={<QuickViewChip />}
      />
      <div className="flex flex-1 items-center justify-center px-(--gutter) py-10">
        <Glass pad="lg" className="flex w-full max-w-180 flex-col gap-5">
          <MonoLabel variant="mono-eyebrow" tone="volt">
            {ui.placeholder.comingIn} {copy.phase}
          </MonoLabel>
          <Heading level={1} variant="d2">
            {copy.heading}
          </Heading>
          <Text as="p" variant="body" tone="secondary">
            {copy.description}
          </Text>
          <nav aria-label={ui.placeholder.siteMap} className="flex flex-col gap-3">
            <MonoLabel>{ui.placeholder.siteMap}</MonoLabel>
            <ul className="flex flex-wrap gap-2">
              {MAP.map((key) => (
                <li key={key}>
                  <ArenaLink
                    to={ROUTES[key]}
                    aria-current={key === route ? "page" : undefined}
                    className="inline-flex h-11 items-center border border-line-strong px-3.5 type-mono-tag text-floodlight transition-colors hover:border-volt hover:text-volt aria-[current=page]:border-volt aria-[current=page]:text-volt"
                  >
                    {routeLabel(key)}
                  </ArenaLink>
                </li>
              ))}
            </ul>
          </nav>
        </Glass>
      </div>
      {announce ? (
        <CommentarySlot tag={ui.comm.tag} className="absolute bottom-9 left-(--gutter)" />
      ) : null}
    </Root>
  );
}
