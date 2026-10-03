import { cva } from "class-variance-authority";
import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
import { Icon } from "./Icon";
import type { IconName } from "./icons";

export const buttonVariants = cva(
  "floodlight-sweep relative inline-flex cursor-pointer items-center justify-center select-none transition-[background-color,border-color,color,transform] duration-(--dur-snap) ease-snap active:scale-97 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-volt text-volt-ink shadow-glow-cta hover:bg-volt-hover",
        secondary: "glass text-floodlight hover:bg-white-a10",
        outline: "border border-line-3 text-floodlight hover:border-volt",
        ghost: "text-floodlight hover:text-volt",
      },
      size: {
        s: "h-13 px-6.5 type-btn",
        m: "h-15.5 px-10 type-btn",
        l: "h-18.5 px-10 type-btn-xl",
        xl: "h-19.5 w-77.5 flex-col gap-1 type-btn-xl",
      },
      skew: {
        always: "-skew-x-12",
        desktop: "md:-skew-x-12",
        never: "",
      },
    },
    defaultVariants: { variant: "primary", size: "m", skew: "desktop" },
  },
);

// The label is counter-skewed so text stays upright inside the parallelogram.
const LABEL_SKEW = { always: "skew-x-12", desktop: "md:skew-x-12", never: "" } as const;

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
    <Comp
      {...rest}
      {...typeProp}
      className={cn(
        buttonVariants({ variant, size, skew: skewKey }),
        pulse && variant === "primary" && "animate-cta-glow",
        className,
      )}
    >
      <span className={cn("inline-flex items-center gap-2.5", LABEL_SKEW[skewKey])}>
        {children}
        {iconRight ? <Icon name={iconRight} size={18} /> : null}
      </span>
      {subLabel ? (
        <span className={cn("type-mono-tag", subTone, LABEL_SKEW[skewKey])}>{subLabel}</span>
      ) : null}
    </Comp>
  );
}
