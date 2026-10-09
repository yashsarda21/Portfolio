import { cn } from "@/lib/cn";

/**
 * One side of the court to return to (Tennis-Play): a 142x60 button. `open` lights the side that is open; idle
 * it is a dashed outline. It is disabled while no serve is in play. `name` is the accessible name (the spoken
 * side); `label` is what is drawn ("← LEFT").
 */
export function AimZone({
  label,
  name,
  open,
  disabled = false,
  tabbable = true,
  onPick,
  className,
}: {
  label: string;
  name: string;
  open: boolean;
  disabled?: boolean;
  tabbable?: boolean;
  onPick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={name}
      data-state={open ? "open" : "idle"}
      disabled={disabled}
      tabIndex={tabbable ? undefined : -1}
      onClick={onPick}
      className={cn(
        "h-15 w-35.5 cursor-pointer border type-mono-tag transition-colors duration-(--dur-snap) ease-snap hover:bg-volt-a22 disabled:pointer-events-none disabled:opacity-40",
        open
          ? "border-volt bg-volt-a12 text-volt"
          : "border-dashed border-floodlight-a35 bg-white-a03 text-scout",
        className,
      )}
    >
      {label}
    </button>
  );
}
