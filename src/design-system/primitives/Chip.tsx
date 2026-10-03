import { cva } from "class-variance-authority";
import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";

export type ChipTone = "outline" | "strong" | "meta" | "volt" | "volt-outline";
type ChipSize = "sm" | "md" | "lg";

export const chipVariants = cva("inline-flex items-center gap-2 whitespace-nowrap type-mono-md", {
  variants: {
    tone: {
      outline: "border border-line-strong text-floodlight",
      strong: "border border-line-3 text-floodlight",
      meta: "border border-line-strong text-text-2",
      volt: "bg-volt text-volt-ink",
      "volt-outline": "border border-volt text-volt",
    },
    size: {
      sm: "h-7.5 px-2.5",
      md: "h-8 px-3",
      lg: "px-3 py-2",
    },
  },
  defaultVariants: { tone: "outline", size: "md" },
});

export function Chip<T extends ElementType = "span">({
  as,
  tone,
  size,
  className,
  ...rest
}: PolymorphicProps<T, { tone?: ChipTone; size?: ChipSize }>) {
  const Comp: ElementType = as ?? "span";
  return <Comp className={cn(chipVariants({ tone, size }), className)} {...rest} />;
}

interface ChipListProps {
  items: string[];
  tone?: ChipTone;
  size?: ChipSize;
  /** Accessible name for the list (e.g. "Stack"). */
  label?: string;
  className?: string;
}

export function ChipList({ items, tone, size, label, className }: ChipListProps) {
  return (
    <ul aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <li key={item}>
          <Chip tone={tone} size={size}>
            {item}
          </Chip>
        </li>
      ))}
    </ul>
  );
}
