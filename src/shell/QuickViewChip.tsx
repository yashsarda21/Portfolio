import { HUDButton } from "@/design-system";
import { ui } from "@/content";
import { ArenaLink } from "./ArenaLink";
import { ROUTES } from "./routes";

interface QuickViewChipProps {
  className?: string;
  /** "glass-line" is the content pages' chip: glass on desktop, a bordered chip on the phone. */
  tone?: "glass" | "glass-line";
}

export function QuickViewChip({ className, tone }: QuickViewChipProps) {
  return (
    <HUDButton as={ArenaLink} to={ROUTES.scout} tone={tone} className={className}>
      {ui.hud.quickView}
    </HUDButton>
  );
}
