import { cva } from "class-variance-authority";
import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
import { Icon } from "../primitives/Icon";
import type { IconName } from "../primitives/icons";
import { Text } from "../primitives/Text";

// Every class is written out in full so Tailwind generates it (never build class names).
const actionRowVariants = cva("flex items-center justify-between gap-4 px-5.5 text-left", {
  variants: {
    tone: {
      // The volt call to action: 74px, ink on volt. No border, so the box is the drawn 74.
      primary: "h-18.5 bg-volt text-volt-ink",
      // Glass row: 64px content-box plus its 1px borders = 66. The border turns volt on hover.
      glass: "glass box-content h-16 text-floodlight hover:border-volt",
    },
  },
  defaultVariants: { tone: "glass" },
});

type ActionRowOwnProps = {
  title: string;
  /** The line under the title. */
  sub: string;
  /** Trailing icon (arrow, download, copy). Decorative. */
  icon: IconName;
  tone: "primary" | "glass";
  /**
   * Replaces the sub-line (e.g. "LINK COPIED ✓"). Visual only: the row is not a live region, so the consumer
   * owns the announcement (a separate `role="status"` beside the row) and may hide this from assistive tech.
   */
  status?: ReactNode;
};

/** A "take the card with you" row: a link by default, a button with `as="button"`. */
export function ActionRow<T extends ElementType = "a">({
  as,
  title,
  sub,
  icon,
  tone,
  status,
  className,
  ...rest
}: PolymorphicProps<T, ActionRowOwnProps>) {
  const Comp: ElementType = as ?? "a";
  const primary = tone === "primary";
  return (
    <Comp {...rest} className={cn(actionRowVariants({ tone }), className)}>
      <span className="flex flex-col">
        <Text variant={primary ? "action-lg" : "action"}>{title}</Text>
        <Text variant="mono-note" tone={primary ? "ink-2" : "label"} caps>
          {status ?? sub}
        </Text>
      </span>
      <Icon name={icon} size={primary ? 22 : 20} />
    </Comp>
  );
}
