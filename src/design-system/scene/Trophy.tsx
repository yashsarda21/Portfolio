import { cva } from "class-variance-authority";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Plinth } from "./Plinth";

export type TrophyKind = "cup" | "medal" | "plaque" | "pennant" | "round";

type TrophyProps = {
  kind: TrophyKind;
  /** The lettering drawn on the art: the medal's figure ("99.5"), the plaque's word ("PAPER"). */
  label?: string;
  /** Turn on a turntable (12s). Only the figure turns; its plinth stays. The parent can set perspective. */
  spinning?: boolean;
  /** art: the artboard's size at every width · phone: 80% below 768px (art size from there up), in a stage of one height. */
  scale?: "art" | "phone";
} & Omit<ComponentPropsWithRef<"span">, "children">;

const FIGURE = "relative flex flex-col items-center";

// Literal classes so Tailwind generates them. The phone stage is 156px (39 x 4): the plaque on its plinth.
const trophyRoot = cva(`${FIGURE} [perspective:800px]`, {
  variants: {
    scale: { art: "", phone: "max-md:h-39 max-md:justify-end max-md:scene-zoom-sm" },
  },
  defaultVariants: { scale: "art" },
});

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
          <span className="relative h-17.5 w-21 trophy-cup-shape trophy-cup">
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
            <span className="trophy-glyph-md text-trophy-silver-ink">{label}</span>
          </span>
        </>
      );
    case "plaque":
      return (
        <span className="flex h-29.5 w-24 items-center justify-center border-3 border-trophy-gold-body trophy-wood">
          <span className="flex h-17.5 w-15 items-center justify-center trophy-plate">
            <span className="trophy-glyph-sm text-trophy-wood-hi">{label}</span>
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
  }
}

/**
 * One trophy: the figure on its plinth, aria-hidden (the cell around it carries the name).
 */
export function Trophy({ kind, label, spinning = false, scale, className, ...rest }: TrophyProps) {
  const plinth =
    kind === "cup" ? (
      <Plinth size="lg" />
    ) : kind === "medal" || kind === "plaque" ? (
      <Plinth size="lg" className="mt-2.5" />
    ) : (
      <Plinth size="md" />
    );
  return (
    <span
      aria-hidden="true"
      data-kind={kind}
      className={cn(trophyRoot({ scale }), className)}
      {...rest}
    >
      <span className={cn(FIGURE, spinning && "animate-turntable")}>{figure(kind, label)}</span>
      {plinth}
    </span>
  );
}
