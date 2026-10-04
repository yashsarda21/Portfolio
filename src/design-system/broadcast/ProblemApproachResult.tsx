import { cn } from "@/lib/cn";

interface Cell {
  label: string;
  text: string;
}

interface ProblemApproachResultProps {
  serve: Cell;
  rally: Cell;
  winner: Cell;
  /** Id of the list, so a video can point at it as its text alternative. */
  id?: string;
  className?: string;
}

const CELL = "flex flex-col gap-2 p-4";

/**
 * Three cells: the problem, the approach, the result (the result is volt-tinted). Side by side while the
 * slot is wide enough, stacked once it is narrower than ~544px.
 */
export function ProblemApproachResult({
  serve,
  rally,
  winner,
  id,
  className,
}: ProblemApproachResultProps) {
  return (
    <div className={cn("@container", className)}>
      <dl id={id} className="grid grid-cols-1 gap-0.5 @min-[34rem]:grid-cols-3">
        {[serve, rally].map((cell) => (
          <div key={cell.label} className={cn(CELL, "glass")}>
            <dt className="type-mono-label text-scout">{cell.label}</dt>
            <dd className="type-body-cell text-text-1">{cell.text}</dd>
          </div>
        ))}
        <div className={cn(CELL, "border border-volt-a35 bg-volt-a08")}>
          <dt className="type-mono-label text-volt">{winner.label}</dt>
          <dd className="type-body-cell text-floodlight">{winner.text}</dd>
        </div>
      </dl>
    </div>
  );
}
