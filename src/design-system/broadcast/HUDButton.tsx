import { cva } from "class-variance-authority";
import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
import { Icon } from "../primitives/Icon";
import type { IconName } from "../primitives/icons";

export const hudButtonVariants = cva(
  "inline-flex h-11 cursor-pointer items-center gap-2.5 px-4 type-mono-md leading-auto transition-colors duration-(--dur-snap) ease-snap",
  {
    variants: {
      tone: {
        glass: "glass text-floodlight hover:bg-white-a10",
        // Glass from 768 up; on the phone artboards the control is a plain bordered chip (12px gutters, 11px type).
        "glass-line":
          "glass text-floodlight hover:bg-white-a10 max-md:border-line-strong max-md:bg-transparent max-md:px-3 max-md:type-mono-xs",
        // The artboard's border is content-box (+2px): 46px with the border, vs the glass 44px.
        "volt-outline":
          "h-11.5 border border-volt bg-transparent text-volt hover:border-volt-hover hover:text-volt-hover",
      },
    },
    defaultVariants: { tone: "glass" },
  },
);

/** HUD control (QUICK VIEW, SKIP INTRO, REMATCH…). 44px tall (46px outlined); glass by default, volt outline on request. */
export function HUDButton<T extends ElementType = "button">({
  as,
  icon,
  tone,
  className,
  children,
  ...rest
}: PolymorphicProps<T, { icon?: IconName; tone?: "glass" | "glass-line" | "volt-outline" }>) {
  const Comp: ElementType = as ?? "button";
  const typeProp = Comp === "button" ? { type: (rest as { type?: string }).type ?? "button" } : {};
  return (
    <Comp {...rest} {...typeProp} className={cn(hudButtonVariants({ tone }), className)}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </Comp>
  );
}
