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
  "group/button relative isolate inline-flex cursor-pointer items-center justify-center select-none outline-none transition-[color,transform] duration-(--dur-snap) ease-snap active:scale-97 disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "text-volt-ink",
        secondary: "text-floodlight",
        outline: "text-floodlight",
        ghost: "text-floodlight hover:text-volt",
        panel: "text-floodlight",
      },
      size: {
        // One line, never squeezed. On the phone it is the full-width bar (type-btn-bar, 54px), the look of `bar`.
        s: "h-13 shrink-0 px-6.5 type-btn whitespace-nowrap max-md:h-13.5 max-md:w-full max-md:px-4 max-md:type-btn-bar",
        m: "h-15.5 px-10 type-btn",
        l: "h-18.5 px-10 type-btn-xl",
        // The form's send button (Team-Up): the 62px body of `m` with the 24px heavy label. Full width on the phone.
        form: "h-15.5 px-10 type-btn-lg whitespace-nowrap max-md:w-full max-md:px-4",
        xl: "h-19.5 w-77.5 flex-col gap-1 type-btn-xl",
        cta: "min-h-14 px-7 type-btn-heavy",
        bar: "h-13.5 w-full px-4 type-btn-bar",
      },
    },
    compoundVariants: [
      // The artboards' borders are content-box: an outlined control is 2px taller than a filled one.
      { variant: ["outline", "panel"], size: "cta", className: "min-h-14.5" },
      { variant: ["outline", "panel"], size: "bar", className: "h-14" },
    ],
    defaultVariants: { variant: "primary", size: "m" },
  },
);

export const buttonPlateVariants = cva(
  "floodlight-sweep pointer-events-none absolute inset-0 -z-10 transition-[background-color,border-color] duration-(--dur-snap) ease-snap group-focus-visible/button:outline-2 group-focus-visible/button:outline-solid group-focus-visible/button:outline-offset-3 group-focus-visible/button:outline-volt",
  {
    variants: {
      variant: {
        primary: "bg-volt group-hover/button:bg-volt-hover",
        secondary: "glass group-hover/button:bg-white-a10",
        outline: "border border-line-3 group-hover/button:border-volt",
        ghost: "",
        panel: "border border-line-3 bg-inset group-hover/button:border-volt",
      },
      glow: { true: "", false: "" },
      skew: {
        always: "-skew-x-12",
        desktop: "md:-skew-x-12",
        never: "",
      },
    },
    // The CTA glow belongs to the primary plate only; glow={false} turns it off.
    compoundVariants: [{ variant: "primary", glow: true, className: "shadow-glow-cta" }],
    defaultVariants: { variant: "primary", skew: "desktop", glow: true },
  },
);

type Variant = "primary" | "secondary" | "outline" | "ghost" | "panel";

export type ButtonOwnProps = {
  variant?: Variant;
  size?: "s" | "m" | "l" | "form" | "xl" | "cta" | "bar";
  /** true = always skewed, false = never, "desktop" = skewed from 768px up (default). */
  skew?: boolean | "desktop";
  /** Second line under the label (XL CTAs). */
  subLabel?: ReactNode;
  /** Volt glow pulse for the hero CTA. */
  pulse?: boolean;
  /** Volt glow shadow under the primary plate (default true). */
  glow?: boolean;
  iconRight?: IconName;
};

export function Button<T extends ElementType = "button">({
  as,
  variant = "primary",
  size,
  skew = "desktop",
  subLabel,
  pulse = false,
  glow = true,
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
    <Comp
      {...rest}
      {...typeProp}
      data-sweep-host=""
      className={cn(
        buttonVariants({ variant, size }),
        subLabel ? "flex-col gap-1" : undefined,
        className,
      )}
    >
      <span
        aria-hidden="true"
        data-plate
        className={cn(
          buttonPlateVariants({ variant, skew: skewKey, glow }),
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
