import { cn } from "@/lib/cn";
import { HUDButton } from "./HUDButton";

/**
 * The BACK control (derived: no artboard draws it): a HUD button with an arrow and the label. Below 768px only the
 * arrow shows, in a 44px square, so `name` is its accessible name; the label stays readable to assistive tech.
 */
export function BackButton({
  onBack,
  arrow,
  label,
  name,
  className,
}: {
  onBack: () => void;
  /** The arrow glyph, drawn before the label. */
  arrow: string;
  label: string;
  name: string;
  className?: string;
}) {
  return (
    <HUDButton
      tone="glass-line"
      aria-label={name}
      onClick={onBack}
      className={cn("shrink-0 max-md:w-11 max-md:justify-center max-md:px-0", className)}
    >
      <span aria-hidden="true">{arrow}</span>
      <span className="max-md:sr-only">{label}</span>
    </HUDButton>
  );
}
