import { cn } from "@/lib/cn";

// Sizes from the boards, as content boxes (the 2px border is drawn outside, as the artboards do). Class strings stay literal.
const SIZE = {
  yash: { stage: "h-4 w-15", column: "h-3 w-10.5" },
  you: { stage: "h-4.5 w-18", column: "h-3 w-10.5" },
} as const;

/**
 * The ellipse that marks a player on the ground. Yash's is a 2px volt ring with the ring glow; yours a 2px
 * floodlight ring. Cricket draws 60x16 and 72x18, the stage's other boards 56x14 and 70x18 (pass the size in
 * `className`), the phone's column 42x12. Position it with `className`. Decorative.
 */
export function TrackingRing({
  who,
  size,
  className,
}: {
  who: "yash" | "you";
  size: "stage" | "column";
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      data-who={who}
      className={cn(
        "pointer-events-none absolute box-content rounded-full border-2",
        who === "yash" ? "border-volt shadow-glow-ring" : "border-floodlight",
        SIZE[who][size],
        className,
      )}
    />
  );
}
