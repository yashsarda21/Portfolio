import { useLocation } from "react-router";
import { ui } from "@/content";
import { MobileTabBar, type IconName } from "@/design-system";
import { ArenaLink } from "./ArenaLink";
import { ROUTES } from "./routes";

const TABS = [
  { key: "arena", label: ui.tabs.arena, icon: "arena", to: ROUTES.arena },
  { key: "career", label: ui.tabs.career, icon: "stats", to: ROUTES.career },
  { key: "projects", label: ui.tabs.projects, icon: "play", to: ROUTES.highlights },
  { key: "skills", label: ui.tabs.skills, icon: "list", to: ROUTES.attributes },
  { key: "teamUp", label: ui.tabs.teamUp, icon: "plus-circle", to: ROUTES.teamUp },
] as const satisfies readonly { key: string; label: string; icon: IconName; to: string }[];

/** The phone's main navigation. The tab for the page you are on (or under, like /arena/cricket) is current. */
export function ArenaTabBar() {
  const { pathname } = useLocation();
  return (
    <MobileTabBar
      label={ui.tabs.label}
      items={TABS.map((tab) => ({
        ...tab,
        as: ArenaLink,
        current: pathname === tab.to || pathname.startsWith(`${tab.to}/`),
      }))}
    />
  );
}
