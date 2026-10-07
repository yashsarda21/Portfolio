import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
import { Icon } from "../primitives/Icon";
import type { IconName } from "../primitives/icons";
import { Text } from "../primitives/Text";

type ChannelCardOwnProps = {
  icon: IconName;
  title: string;
  /** The address or handle under the title. */
  sub: string;
  /** Trailing mark (↗). Decorative: hidden from assistive tech. */
  glyph: ReactNode;
};

/** A direct line on Team Up: a glass link with a volt icon, a title, a handle and an arrow. */
export function ChannelCard<T extends ElementType = "a">({
  as,
  icon,
  title,
  sub,
  glyph,
  className,
  ...rest
}: PolymorphicProps<T, ChannelCardOwnProps>) {
  const Comp: ElementType = as ?? "a";
  return (
    <Comp
      {...rest}
      className={cn(
        // 70px content-box plus the glass border = 72. Columns: icon 44, text, glyph 20.
        "box-content grid h-17.5 grid-cols-[44px_minmax(0,1fr)_20px] items-center gap-3.5 glass px-4.5 text-floodlight hover:border-volt",
        className,
      )}
    >
      <Icon name={icon} size={22} className="text-volt" />
      <span className="flex min-w-0 flex-col">
        <Text variant="action">{title}</Text>
        <Text variant="mono-stack" tone="label">
          {sub}
        </Text>
      </span>
      <Text variant="body" leading="font" aria-hidden="true">
        {glyph}
      </Text>
    </Comp>
  );
}
