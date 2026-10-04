import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Plinth } from "./Plinth";

export type TrophyKind = "cup" | "medal" | "plaque" | "pennant" | "round" | "locked";

type TrophyProps = {
  kind: TrophyKind;
  /** The lettering drawn on the art: the medal's figure ("99.5"), the plaque's word ("PAPER"), the locked mark (default "?"). */
  label?: string;
  /** Turn on a turntable (12s). Only the figure turns; its plinth stays. The parent can set perspective. */
  spinning?: boolean;
} & Omit<ComponentPropsWithRef<"span">, "children">;

const FIGURE = "relative flex flex-col items-center";

/**
 * The figures, drawn from boxes as the Trophy-Room artboard draws them. Sizes are the artboard's pixels. The
 * trophy colours exist only inside `[data-zone="trophy"]`, so these must render inside one.
 * Content-box where the artboard is (the handles and the round's ring add their border to their size).
 */
function figure(kind: TrophyKind, label: string | undefined): ReactNode {
  switch (kind) {
    case "cup":
      return (
        <>
          <span className="relative h-17.5 w-21 trophy-cup">
            <span className="absolute top-2 -left-5.5 box-content h-7.5 w-4.5 rounded-tl-[18px] rounded-bl-[18px] border-5 border-r-0 border-trophy-gold-body" />
            <span className="absolute top-2 -right-5.5 box-content h-7.5 w-4.5 rounded-tr-[18px] rounded-br-[18px] border-5 border-l-0 border-trophy-gold-body" />
          </span>
          <span className="h-7.5 w-3 trophy-stem" />
          <span className="h-3 w-16 trophy-base" />
        </>
      );
    case "medal":
      return (
        <>
          <span className="h-11 w-10 trophy-ribbon" />
          <span className="flex size-18.5 items-center justify-center trophy-medal">
            <span className="type-glyph-md text-trophy-silver-ink">{label}</span>
          </span>
        </>
      );
    case "plaque":
      return (
        <span className="flex h-29.5 w-24 items-center justify-center border-3 border-trophy-gold-body trophy-wood">
          <span className="flex h-17.5 w-15 items-center justify-center trophy-plate">
            <span className="type-glyph-sm text-trophy-wood-hi">{label}</span>
          </span>
        </span>
      );
    case "pennant":
      return (
        <>
          <span className="h-21 w-17 trophy-pennant" />
          <span className="h-3 w-20 trophy-base" />
        </>
      );
    case "round":
      return (
        <>
          <span className="flex size-15.5 items-center justify-center trophy-sphere">
            <span className="box-content size-7.5 rounded-full border-2 border-trophy-wood-hi/60" />
          </span>
          <span className="h-6 w-3 trophy-stem" />
        </>
      );
    case "locked":
      // The dashes are decoration (line-3 is for borders only). The "?" is lettering, so it takes the dim text grey (spec A1).
      return (
        <>
          <span className="flex h-17.5 w-21 items-center justify-center rounded-[4px_4px_42px_42px] border-2 border-dashed border-line-3">
            <span className="type-glyph-lg text-dim">{label ?? "?"}</span>
          </span>
          <span className="h-7.5 w-3 border-x-2 border-dashed border-line-3" />
          <span className="h-5.5 w-22.5 border-2 border-dashed border-line-3" />
        </>
      );
  }
}

/**
 * One trophy: the figure on its plinth, aria-hidden (the cell around it carries the name). `locked` is the
 * dashed outline of a trophy not yet won: dimmed, with its own dashed base instead of a plinth.
 */
export function Trophy({ kind, label, spinning = false, className, ...rest }: TrophyProps) {
  const plinth =
    kind === "cup" ? (
      <Plinth size="lg" />
    ) : kind === "medal" || kind === "plaque" ? (
      <Plinth size="lg" className="mt-2.5" />
    ) : kind === "pennant" || kind === "round" ? (
      <Plinth size="md" />
    ) : null;
  return (
    <span
      aria-hidden="true"
      data-kind={kind}
      className={cn(FIGURE, "[perspective:800px]", kind === "locked" && "opacity-60", className)}
      {...rest}
    >
      <span className={cn(FIGURE, spinning && "animate-turntable")}>{figure(kind, label)}</span>
      {plinth}
    </span>
  );
}
