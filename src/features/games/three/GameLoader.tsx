import { MonoLabel } from "@/design-system";
import { cn } from "@/lib/cn";

/**
 * The loading bar a game shows while its 3D scene downloads: a label over a thin bar. The fill only grows by
 * `transform: scaleX`, so nothing re-lays-out. The stage is as wide as the timing meter (640); the column is full width.
 */
export function GameLoader({
  label,
  progress,
  size,
}: {
  label: string;
  /** 0 to 1. */
  progress: number;
  size: "stage" | "column";
}) {
  const fraction = Math.min(1, Math.max(0, progress));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(fraction * 100)}
      data-size={size}
      className={cn("flex flex-col gap-3", size === "stage" ? "w-160" : "w-full")}
    >
      <MonoLabel>{label}</MonoLabel>
      <div className="h-1 w-full overflow-hidden bg-line-strong">
        <div
          data-part="fill"
          className="h-full origin-left bg-volt will-change-transform"
          style={{ transform: `scaleX(${fraction})` }}
        />
      </div>
    </div>
  );
}
