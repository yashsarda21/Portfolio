import { cva } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";
import type { IconName } from "./icons";

const iconButtonVariants = cva(
  "inline-flex size-11 cursor-pointer items-center justify-center text-floodlight transition-colors duration-(--dur-snap) ease-snap hover:text-volt",
  {
    variants: {
      variant: {
        glass: "glass hover:bg-white-a10",
        outline: "border border-line-strong hover:border-volt",
      },
    },
    defaultVariants: { variant: "glass" },
  },
);

type IconButtonProps = {
  icon: IconName;
  /** Accessible name — icon-only controls must always be named. */
  label: string;
  /** Set for toggle buttons (e.g. crowd audio); omit for plain actions. */
  pressed?: boolean;
  variant?: "glass" | "outline";
} & Omit<ComponentPropsWithRef<"button">, "children" | "aria-label" | "aria-pressed">;

export function IconButton({
  icon,
  label,
  pressed,
  variant,
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      className={cn(iconButtonVariants({ variant }), className)}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
}
