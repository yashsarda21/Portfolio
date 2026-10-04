import { cva } from "class-variance-authority";
import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
import { Icon } from "../primitives/Icon";
import type { IconName } from "../primitives/icons";

export const hudButtonVariants = cva(
  "inline-flex h-11 cursor-pointer items-center gap-2.5 px-4 type-mono-md transition-colors duration-(--dur-snap) ease-snap",
  {
    variants: {
      tone: {
        glass: "glass text-floodlight hover:bg-white-a10",
        "volt-outline":
          "border border-volt bg-transparent text-volt hover:border-volt-hover hover:text-volt-hover",
      },
    },
    defaultVariants: { tone: "glass" },
  },
);

/** HUD control (QUICK VIEW, SKIP INTRO, REMATCH…). 44px tall; glass by default, volt outline on request. */
export function HUDButton<T extends ElementType = "button">({
  as,
  icon,
  tone,
  className,
  children,
  ...rest
}: PolymorphicProps<T, { icon?: IconName; tone?: "glass" | "volt-outline" }>) {
  const Comp: ElementType = as ?? "button";
  const typeProp = Comp === "button" ? { type: (rest as { type?: string }).type ?? "button" } : {};
  return (
    <Comp {...rest} {...typeProp} className={cn(hudButtonVariants({ tone }), className)}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </Comp>
  );
}
