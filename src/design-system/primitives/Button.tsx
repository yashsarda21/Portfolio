import { cva } from "class-variance-authority";
import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
import { Icon } from "./Icon";
import type { IconName } from "./icons";

// The root is never transformed: text stays on an un-skewed layer so Chromium rasterizes it
// crisply (a skewed backdrop-filter layer resamples the label twice and stripes the glyphs).
// The slanted shape is a separate background plate (see buttonPlateVariants).
export const buttonVariants = cva(
  "group relative isolate inline-flex cursor-pointer items-center justify-center select-none outline-none transition-[color,transform] duration-(--dur-snap) ease-snap active:scale-97 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "text-volt-ink",
        secondary: "text-floodlight",
        outline: "text-floodlight",
        ghost: "text-floodlight hover:text-volt",
      },
      size: {
        s: "h-13 px-6.5 type-btn",
        m: "h-15.5 px-10 type-btn",
        l: "h-18.5 px-10 type-btn-xl",
        xl: "h-19.5 w-77.5 flex-col gap-1 type-btn-xl",
      },
    },
    defaultVariants: { variant: "primary", size: "m" },
  },
);

export const buttonPlateVariants = cva(
  "floodlight-sweep pointer-events-none absolute inset-0 -z-10 transition-[background-color,border-color] duration-(--dur-snap) ease-snap group-focus-visible:outline-2 group-focus-visible:outline-solid group-focus-visible:outline-offset-3 group-focus-visible:outline-volt",
  {
    variants: {
      variant: {
        primary: "bg-volt shadow-glow-cta group-hover:bg-volt-hover",
        secondary: "glass group-hover:bg-white-a10",
        outline: "border border-line-3 group-hover:border-volt",
        ghost: "",
      },
      skew: {
        always: "-skew-x-12",
        desktop: "md:-skew-x-12",
        never: "",
      },
    },
    defaultVariants: { variant: "primary", skew: "desktop" },
  },
);

type Variant = "primary" | "secondary" | "outline" | "ghost";

export type ButtonOwnProps = {
  variant?: Variant;
  size?: "s" | "m" | "l" | "xl";
  /** true = always skewed, false = never, "desktop" = skewed from 768px up (default). */
  skew?: boolean | "desktop";
  /** Second line under the label (XL CTAs). */
  subLabel?: ReactNode;
  /** Volt glow pulse for the hero CTA. */
  pulse?: boolean;
  iconRight?: IconName;
};

export function Button<T extends ElementType = "button">({
  as,
  variant = "primary",
  size,
  skew = "desktop",
  subLabel,
  pulse = false,
  iconRight,
  className,
  children,
  ...rest
}: PolymorphicProps<T, ButtonOwnProps>) {
  const Comp: ElementType = as ?? "button";
  const skewKey = skew === true ? "always" : skew === false ? "never" : "desktop";
  const typeProp = Comp === "button" ? { type: (rest as { type?: string }).type ?? "button" } : {};
  const subTone = variant === "primary" ? "text-volt-ink-2" : "text-scout";

  return (
    <Comp {...rest} {...typeProp} className={cn(buttonVariants({ variant, size }), className)}>
      <span
        aria-hidden="true"
        data-plate
        className={cn(
          buttonPlateVariants({ variant, skew: skewKey }),
          pulse && variant === "primary" && "animate-cta-glow",
        )}
      />
      <span className="inline-flex items-center gap-2.5">
        {children}
        {iconRight ? <Icon name={iconRight} size={18} /> : null}
      </span>
      {subLabel ? <span className={cn("type-mono-tag", subTone)}>{subLabel}</span> : null}
    </Comp>
  );
}
