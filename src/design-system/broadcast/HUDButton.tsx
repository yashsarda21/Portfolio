import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
import { Icon } from "../primitives/Icon";
import type { IconName } from "../primitives/icons";

/** Glass HUD control (QUICK VIEW, SKIP INTRO, REMATCH…). 44px tall. */
export function HUDButton<T extends ElementType = "button">({
  as,
  icon,
  className,
  children,
  ...rest
}: PolymorphicProps<T, { icon?: IconName }>) {
  const Comp: ElementType = as ?? "button";
  const typeProp = Comp === "button" ? { type: (rest as { type?: string }).type ?? "button" } : {};
  return (
    <Comp
      {...rest}
      {...typeProp}
      className={cn(
        "inline-flex h-11 cursor-pointer items-center gap-2.5 glass px-4 type-mono-md text-floodlight transition-colors duration-(--dur-snap) ease-snap hover:bg-white-a10",
        className,
      )}
    >
      {icon ? <Icon name={icon} /> : null}
      {children}
    </Comp>
  );
}
