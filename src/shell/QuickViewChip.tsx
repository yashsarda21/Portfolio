import { HUDButton } from "@/design-system";
import { ui } from "@/content";
import { ArenaLink } from "./ArenaLink";
import { ROUTES } from "./routes";

export function QuickViewChip({ className }: { className?: string }) {
  return (
    <HUDButton as={ArenaLink} to={ROUTES.scout} className={className}>
      {ui.hud.quickView}
    </HUDButton>
  );
}
