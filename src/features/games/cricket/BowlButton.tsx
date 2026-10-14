import type { KeyboardEvent, ReactNode } from "react";
import { Button } from "@/design-system";

/** The keys that bowl when the button itself has the focus. */
const isBowlKey = (e: KeyboardEvent) => e.key === " " || e.key === "Enter";

/**
 * BOWL, as the stage and the column both draw it. A click or a tap bowls; so do Space and Enter while the button has
 * the focus, and they do it on the key going down, like the game keys do anywhere else on the page (a button's own
 * Space fires on the key coming up, 80 to 150 ms later: late against a 76 ms perfect window). Key repeats bowl
 * nothing, and the key coming up is stopped so no click follows. `onBowl` is safe to call twice: one input is one ball.
 */
export function BowlButton({
  onBowl,
  disabled,
  size,
  skew,
  pulse,
  glow,
  className,
  children,
}: {
  onBowl: () => void;
  /** No ball to bowl: aria-disabled, not `disabled`, so it keeps its place in the tab order. */
  disabled: boolean;
  size: "m" | "tap";
  skew: boolean;
  pulse?: "ring";
  glow: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Button
      size={size}
      skew={skew}
      pulse={pulse}
      glow={glow}
      className={className}
      aria-disabled={disabled}
      data-game-control=""
      onClick={onBowl}
      onKeyDown={(e) => {
        if (!isBowlKey(e)) return;
        e.preventDefault();
        if (!e.repeat) onBowl();
      }}
      onKeyUp={(e) => {
        if (isBowlKey(e)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
