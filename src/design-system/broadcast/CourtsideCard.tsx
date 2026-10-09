import { cn } from "@/lib/cn";
import { Glass } from "../primitives/Glass";

/**
 * A highlight turned in toward the court (Tennis-Play): a 300 wide glass card, 32 degrees round its outer
 * edge (the left card hinges on its left edge, the right card on its right) inside a 900px perspective. The
 * wrapper is the box to place; `media` is the placeholder text of the 110 high screen-recording slot. There is
 * no phone variant: the column shows the unlock in a `RevealChip`.
 */
export function CourtsideCard({
  eyebrow,
  tag,
  title,
  line,
  media,
  side,
  className,
}: {
  eyebrow: string;
  tag: string;
  title: string;
  line: string;
  media: string;
  side: "left" | "right";
  className?: string;
}) {
  return (
    <div data-side={side} className={cn("perspective-courtside", className)}>
      <Glass
        edge="none"
        elevation="card"
        className={cn(
          "flex w-75 flex-col gap-2.5 border-volt-a40 p-4.5",
          side === "left" ? "origin-left rotate-y-32" : "origin-right -rotate-y-32",
        )}
      >
        <div className="flex justify-between">
          <span className="type-mono-round text-volt">{eyebrow}</span>
          <span className="type-mono-note text-scout">{tag}</span>
        </div>
        <div className="flex h-27.5 items-center justify-center media-stripes">
          <span className="type-mono-note text-dim">{media}</span>
        </div>
        <span className="type-title-card leading-auto">{title}</span>
        <span className="type-caption leading-auto text-text-2">{line}</span>
      </Glass>
    </div>
  );
}
