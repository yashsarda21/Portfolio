import { cva, type VariantProps } from "class-variance-authority";
import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";

/**
 * Responsive grid: as many columns as fit at `min` px each, never narrower than the container.
 * Every class is written out in full so Tailwind generates it (never build class names).
 */
export const autoGridVariants = cva("", {
  variants: {
    min: { 250: "", 300: "", 360: "", 380: "" },
    // `md` = a plain block below 768px, the grid from 768px up.
    from: { start: "grid", md: "md:grid" },
  },
  compoundVariants: [
    {
      min: 250,
      from: "start",
      className: "grid-cols-[repeat(auto-fit,minmax(min(250px,100%),1fr))]",
    },
    {
      min: 300,
      from: "start",
      className: "grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))]",
    },
    {
      min: 360,
      from: "start",
      className: "grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))]",
    },
    {
      min: 380,
      from: "start",
      className: "grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))]",
    },
    {
      min: 250,
      from: "md",
      className: "md:grid-cols-[repeat(auto-fit,minmax(min(250px,100%),1fr))]",
    },
    {
      min: 300,
      from: "md",
      className: "md:grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))]",
    },
    {
      min: 360,
      from: "md",
      className: "md:grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))]",
    },
    {
      min: 380,
      from: "md",
      className: "md:grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))]",
    },
  ],
  defaultVariants: { min: 300, from: "start" },
});

export type AutoGridOwnProps = Pick<
  NonNullable<VariantProps<typeof autoGridVariants>>,
  "min" | "from"
>;

/** A grid that reflows by itself (no breakpoints). The gap is the caller's: pass it in `className`. */
export function AutoGrid<T extends ElementType = "div">({
  as,
  min,
  from,
  className,
  ...rest
}: PolymorphicProps<T, AutoGridOwnProps>) {
  const Comp: ElementType = as ?? "div";
  return <Comp className={cn(autoGridVariants({ min, from }), className)} {...rest} />;
}
