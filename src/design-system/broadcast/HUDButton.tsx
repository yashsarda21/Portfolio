import { cva } from "class-variance-authority";
import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
import { Icon } from "../primitives/Icon";
import type { IconName } from "../primitives/icons";

// The pieces the tones share, each written once. The chip is `hud-chip` (base.css): 12px gutters, 11px type.
const GLASS = "glass text-floodlight hover:bg-white-a10";
const REGULAR = "px-4 type-mono-md leading-auto";

export const hudButtonVariants = cva(
  "inline-flex h-11 cursor-pointer items-center gap-2.5 transition-colors duration-(--dur-snap) ease-snap",
  {
    variants: {
      tone: {
        glass: `${GLASS} ${REGULAR}`,
        // Glass from 768 up; on the phone artboards the control is a plain bordered chip.
        "glass-line": `${GLASS} ${REGULAR} max-md:border-line-strong max-md:bg-transparent max-md:hud-chip`,
        // The phone landing's chip (Mobile-Landing): glass at every width, the chip's gutters and type, no icon.
        "glass-compact": `${GLASS} hud-chip`,
        // The artboard's border is content-box (+2px): 46px with the border, vs the glass 44px.
        "volt-outline": `${REGULAR} h-11.5 border border-volt bg-transparent text-volt hover:border-volt-hover hover:text-volt-hover`,
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
}: PolymorphicProps<
  T,
  { icon?: IconName; tone?: "glass" | "glass-line" | "glass-compact" | "volt-outline" }
>) {
  const Comp: ElementType = as ?? "button";
  const typeProp = Comp === "button" ? { type: (rest as { type?: string }).type ?? "button" } : {};
  return (
    <Comp {...rest} {...typeProp} className={cn(hudButtonVariants({ tone }), className)}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </Comp>
  );
}
