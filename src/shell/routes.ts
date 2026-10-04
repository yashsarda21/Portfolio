import type { RouteKey } from "@/content";

/** Every page in the site map (spec §4.5). app/routes.ts must mirror these paths. */
export const ROUTES: Record<RouteKey, string> = {
  home: "/",
  intro: "/intro",
  arena: "/arena",
  cricket: "/arena/cricket",
  tennis: "/arena/tennis",
  badminton: "/arena/badminton",
  giantKiller: "/arena/giant-killer",
  career: "/career",
  highlights: "/highlights",
  attributes: "/attributes",
  trophies: "/trophies",
  card: "/card",
  teamUp: "/team-up",
  lockerRoom: "/locker-room",
  scout: "/scout",
  notFound: "/404",
};
