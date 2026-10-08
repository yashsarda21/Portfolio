import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { linkProps, type LinkTarget } from "../lib/link";
import { Text } from "../primitives/Text";

const tileVariants = cva(
  "flex flex-col justify-between text-floodlight transition-colors duration-(--dur-snap) ease-snap",
  {
    variants: {
      tone: {
        glass: "glass hover:border-volt",
        volt: "bg-volt text-volt-ink hover:bg-volt-hover",
        line: "border border-line hover:border-volt",
      },
      size: { lg: "h-24 px-4.5 py-4", sm: "h-16 px-3 py-2.5" },
    },
  },
);

type Tone = "glass" | "volt" | "line";
type Size = "lg" | "sm";

interface FacilityTileProps extends LinkTarget {
  label: string;
  title: string;
  tone: Tone;
  size: Size;
  className?: string;
}

/** A facility link on the Hub (Trophy Room, Training Academy, Player Card, Team Up): a small label over a title. */
export function FacilityTile({
  label,
  title,
  tone,
  size,
  className,
  ...target
}: FacilityTileProps) {
  const { as: Comp, ...attrs } = linkProps(target);
  return (
    <Comp data-tone={tone} className={cn(tileVariants({ tone, size }), className)} {...attrs}>
      <Text
        variant={size === "lg" ? "mono-label" : "mono-tag"}
        tone={tone === "volt" ? "ink-2" : "label"}
        leading="font"
      >
        {label}
      </Text>
      <Text
        variant={size === "lg" ? "d4" : "title-tile"}
        tone={tone === "volt" ? "ink" : "primary"}
        leading="font"
      >
        {title}
      </Text>
    </Comp>
  );
}
