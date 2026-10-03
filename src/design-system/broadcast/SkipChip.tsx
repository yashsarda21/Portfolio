import { cva } from "class-variance-authority";
import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
import { Icon } from "../primitives/Icon";

const skipChip = cva(
  "inline-flex cursor-pointer items-center gap-2.5 text-floodlight transition-colors duration-(--dur-snap) ease-snap hover:text-volt",
  {
    variants: {
      variant: {
        game: "glass h-12 px-5 type-mono-md",
        hub: "h-11.5 border border-line-strong px-3.5 type-mono-tag hover:border-volt",
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
      <Icon name="arrow-right" size={16} />
    </Comp>
  );
}
