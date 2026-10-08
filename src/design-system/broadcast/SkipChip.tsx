import { cva } from "class-variance-authority";
import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
import { Icon } from "../primitives/Icon";

const skipChip = cva(
  "inline-flex cursor-pointer items-center text-floodlight transition-colors duration-(--dur-snap) ease-snap hover:text-volt",
  {
    variants: {
      variant: {
        game: "glass h-12 gap-2.5 px-5 type-mono-md",
        // 48px: the artboard draws the 46px chip with a content-box border, 2px taller than the PLAY beside it.
        hub: "h-12 gap-2 border border-line-strong px-3.5 type-mono-xs hover:border-volt",
      },
    },
    defaultVariants: { variant: "game" },
  },
);

/** "SKIP TO …" — always visible in games, ≥44px. */
export function SkipChip<T extends ElementType = "a">({
  as,
  variant,
  className,
  children,
  ...rest
}: PolymorphicProps<T, { variant?: "game" | "hub" }>) {
  const Comp: ElementType = as ?? "a";
  return (
    <Comp className={cn(skipChip({ variant }), className)} {...rest}>
      {children}
      <Icon name="arrow-right" size={variant === "hub" ? 12 : 16} />
    </Comp>
  );
}
