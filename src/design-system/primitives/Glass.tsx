import { cva } from "class-variance-authority";
import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";

export const glassVariants = cva("", {
  variants: {
    surface: {
      glass: "glass",
      solid: "glass-solid",
      panel: "border border-line bg-panel",
      gradient: "border border-line bg-linear-160 from-panel to-stand-3",
      dashed: "border border-dashed border-line-strong",
      none: "",
    },
    edge: {
      none: "",
      "volt-soft": "border-volt-a35",
      volt: "border-volt-a45",
      selected: "border-volt",
    },
    elevation: {
      none: "",
      card: "shadow-card-3d",
      toast: "shadow-toast",
      holo: "shadow-holo",
    },
    pad: {
      none: "",
      sm: "p-3.5",
      md: "p-5",
      lg: "px-5.5 py-5",
    },
  },
  defaultVariants: { surface: "glass", edge: "none", elevation: "none", pad: "none" },
});

export type GlassOwnProps = {
  surface?: "glass" | "solid" | "panel" | "gradient" | "dashed" | "none";
  edge?: "none" | "volt-soft" | "volt" | "selected";
  elevation?: "none" | "card" | "toast" | "holo";
  pad?: "none" | "sm" | "md" | "lg";
};

/** The broadcast panel: frosted stand glass by default (solid, no blur, on mobile via tokens). */
export function Glass<T extends ElementType = "div">({
  as,
  surface,
  edge,
  elevation,
  pad,
  className,
  ...rest
}: PolymorphicProps<T, GlassOwnProps>) {
  const Comp: ElementType = as ?? "div";
  return (
    <Comp className={cn(glassVariants({ surface, edge, elevation, pad }), className)} {...rest} />
  );
}
