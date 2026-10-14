import type { KeyboardEvent, PointerEvent } from "react";
import { Button } from "@/design-system";
import { cn } from "@/lib/cn";

/** The keys that hold a charge when the button itself has the focus. */
const isHoldKey = (e: KeyboardEvent) => e.key === " " || e.key === "Enter";

/**
 * HOLD · RELEASE, as the stage and the column both draw it. A press charges the shot and a let-go plays it: with a
 * pointer (captured, so sliding off the button keeps the hold), or with Space or Enter while the button has the
 * focus. A hold can never get stuck: the browser taking the pointer back (`pointercancel`, `lostpointercapture`) and
 * the button losing the focus let go too. Key repeats charge nothing. `onRelease` is safe to call twice: the game
 * plays one rally per hold.
 */
export function HoldButton({
  label,
  size,
  disabled,
  onCharge,
  onRelease,
  className,
}: {
  /** The words on the button, which also name it. */
  label: string;
  size: "bar-lg" | "tap";
  /** No hold to start: aria-disabled, not `disabled`, so it keeps its place in the tab order. */
  disabled: boolean;
  onCharge: () => void;
  onRelease: () => void;
  className?: string;
}) {
  const press = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* a pointer that is already gone: the press still counts */
    }
    onCharge();
  };
  return (
    <Button
      size={size}
      skew={false}
      glow={false}
      aria-label={label}
      aria-disabled={disabled}
      data-game-control=""
      onPointerDown={press}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onLostPointerCapture={onRelease}
      onBlur={onRelease}
      onKeyDown={(e) => {
        if (!isHoldKey(e)) return;
        e.preventDefault();
        if (!e.repeat) onCharge();
      }}
      onKeyUp={(e) => {
        if (!isHoldKey(e)) return;
        e.preventDefault();
        onRelease();
      }}
      // A long press must not open the touch menu, select the label or pan the page.
      onContextMenu={(e) => e.preventDefault()}
      className={cn("touch-none", className)}
    >
      {label}
    </Button>
  );
}
