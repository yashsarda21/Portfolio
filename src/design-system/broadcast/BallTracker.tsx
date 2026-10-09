import { cn } from "@/lib/cn";

type BallState = "for" | "against" | "current" | "pending";

const STATE: Record<BallState, string> = {
  for: "border-volt bg-volt text-volt-ink",
  against: "border-line-3 bg-panel text-floodlight",
  current: "border-volt bg-volt-a08 text-volt",
  pending: "border-line-strong bg-transparent text-dim",
};

/**
 * The over, one 54x54 cell per ball (Cricket-Play draws 52 inside a 1px border), seen from the bowler's end: dots and wickets are yours (`for`,
 * volt), runs are his (`against`); `current` is the ball you bowl next and `pending` the ones after it.
 */
export function BallTracker({
  balls,
  className,
}: {
  balls: readonly { label: string; state: BallState }[];
  className?: string;
}) {
  return (
    <div className={cn("flex gap-2", className)}>
      {balls.map((ball, i) => (
        <span
          // The over has a fixed order: a cell's place is its identity.
          key={i}
          data-state={ball.state}
          className={cn(
            "flex size-13.5 items-center justify-center border type-title-chip leading-auto",
            STATE[ball.state],
          )}
        >
          {ball.label}
        </span>
      ))}
    </div>
  );
}
