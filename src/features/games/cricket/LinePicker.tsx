import { Button, MonoLabel } from "@/design-system";
import { cn } from "@/lib/cn";
import type { CricketAim } from "./referee";
import type { Cricket3dControls } from "./view";

/**
 * OFF · MIDDLE · LEG, the 3D game's line (spec §3.2): three real buttons, the picked one pressed. It can be changed
 * only while waiting for the bowl; otherwise the buttons are aria-disabled (they keep their place in the tab order)
 * and stay solid over the scene, the picked line still lit, the others' words dimmed. A pointer press never takes
 * the focus, so the next Space bowls; Tab, Space and Enter still reach and press each one. On the stage it sits
 * beside BOWL, compact, named with its keys above (LINE ← →), as tall as BOWL; the column's buttons share the
 * thumb zone's width.
 */
export function LinePicker({
  lines,
  disabled,
  onLine,
  size,
  className,
}: {
  lines: Cricket3dControls["lines"];
  disabled: boolean;
  onLine: (line: CricketAim) => void;
  size: "stage" | "column";
  className?: string;
}) {
  const stage = size === "stage";
  return (
    <div
      role="group"
      aria-label={lines.label}
      data-part="lines"
      className={cn("flex", stage ? "flex-col items-end gap-1" : "w-full", className)}
    >
      {stage ? (
        <MonoLabel aria-hidden="true" variant="mono-tag" tone="label" className="flex gap-2.5">
          <span>{lines.label}</span>
          <span className="text-floodlight">{lines.keys}</span>
        </MonoLabel>
      ) : null}
      <div className={cn("flex", stage ? "gap-0.5" : "w-full gap-2")}>
        {lines.options.map((o) => (
          <Button
            key={o.id}
            variant={o.pressed ? "primary" : "panel"}
            size="card"
            skew={false}
            glow={false}
            aria-pressed={o.pressed}
            aria-disabled={disabled}
            data-game-control=""
            onClick={() => onLine(o.id)}
            // A click or a tap picks the line without taking the focus: the keys stay the game's.
            onMouseDown={(e) => e.preventDefault()}
            className={cn(
              "aria-disabled:opacity-100",
              !o.pressed && "aria-disabled:text-dim",
              stage ? "h-11 px-2.5 type-btn-xs" : "flex-1 px-2",
            )}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
