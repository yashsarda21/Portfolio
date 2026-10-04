import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";

/** Centred page column for fluid pages: 1248px wide (content box), 24px gutters, 16px on mobile. */
export function FluidContainer<T extends ElementType = "div">({
  as,
  className,
  ...rest
}: PolymorphicProps<T>) {
  const Comp: ElementType = as ?? "div";
  return <Comp className={cn("mx-auto max-w-312 px-6 max-md:px-4", className)} {...rest} />;
}
