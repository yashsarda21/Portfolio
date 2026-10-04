import { cva } from "class-variance-authority";
import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
import { Text, type MonoVariant } from "./Text";

// Content-box on purpose: the artboards' header bars are 44px / 48px of content plus the 1px divider.
export const panelHeaderVariants = cva("box-content flex items-center border-b border-line", {
  variants: {
    size: {
      md: "h-11 px-4.5",
      lg: "h-12 px-5.5",
    },
  },
  defaultVariants: { size: "md" },
});

type PanelHeaderOwnProps = {
  /** md: 44px, 18px gutters (a list's title) · lg: 48px, 22px gutters (column headers). */
  size?: "md" | "lg";
  /** The mono recipe of the label (default mono-label). */
  variant?: MonoVariant;
};

/**
 * The bar at the top of a panel: a scout-grey mono label over a hairline divider. It is a visual guide, so it is
 * hidden from assistive tech: the list or table below carries its own accessible name. Pass a grid class
 * (`className`) to line its cells up with the rows under it.
 */
export function PanelHeader<T extends ElementType = "div">({
  as,
  size,
  variant = "mono-label",
  className,
  ...rest
}: PolymorphicProps<T, PanelHeaderOwnProps>) {
  const Comp: ElementType = as ?? "div";
  return (
    <Text
      as={Comp}
      variant={variant}
      tone="label"
      leading="font"
      aria-hidden="true"
      className={cn(panelHeaderVariants({ size }), className)}
      {...rest}
    />
  );
}
