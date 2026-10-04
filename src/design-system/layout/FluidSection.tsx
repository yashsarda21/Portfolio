import { cva, type VariantProps } from "class-variance-authority";
import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";

// The anchor offset clears the sticky header (`scroll-mt-header`), and 128px between 768px and 1200px where
// the header's row wraps onto two lines. It lives here so every section anchors the same way.
export const fluidSectionVariants = cva("scroll-mt-header md:max-lg:scroll-mt-32", {
  variants: {
    stack: { true: "flex flex-col gap-5.5 max-md:gap-2.5", false: "" },
    divided: { true: "max-md:border-t max-md:border-line max-md:pt-4", false: "" },
  },
  defaultVariants: { stack: true, divided: true },
});

export type FluidSectionOwnProps = Pick<
  NonNullable<VariantProps<typeof fluidSectionVariants>>,
  "stack" | "divided"
>;

/**
 * One section of a fluid page: roomy stack on desktop, hairline-separated on mobile, and an anchor
 * offset that clears the sticky header. Name it with `aria-labelledby`.
 */
export function FluidSection<T extends ElementType = "section">({
  as,
  stack,
  divided,
  className,
  ...rest
}: PolymorphicProps<T, FluidSectionOwnProps>) {
  const Comp: ElementType = as ?? "section";
  return <Comp className={cn(fluidSectionVariants({ stack, divided }), className)} {...rest} />;
}
