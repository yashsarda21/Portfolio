import { BackButton } from "@/design-system";
import { ui } from "@/content";
import { ROUTES } from "./routes";
import { useBack } from "./useBack";

/** The BACK control every page after the Intro shows, first in its top bar. `fallback`: where a direct visit goes (the Hub; the Hub's own is Home). */
export function BackChip({
  fallback = ROUTES.arena,
  className,
}: {
  fallback?: string;
  className?: string;
}) {
  return (
    <BackButton
      onBack={useBack(fallback)}
      arrow={ui.glyph.prev}
      label={ui.hud.back}
      name={ui.hud.backName}
      className={className}
    />
  );
}
