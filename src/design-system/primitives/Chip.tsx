import { cva } from "class-variance-authority";
import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
import { MonoLabel } from "./Text";

export type ChipTone = "outline" | "strong" | "meta" | "volt" | "volt-outline";
type ChipSize = "sm" | "md" | "lg" | "meta" | "code";
/** label: the uppercase mono label (default). name: a tool name as written, mixed case, untracked. */
type ChipText = "label" | "name";

export const chipVariants = cva("inline-flex items-center gap-2 whitespace-nowrap type-mono-md", {
  variants: {
    tone: {
      outline: "border border-line-strong text-floodlight",
      strong: "border border-line-3 text-floodlight",
      meta: "border border-line-strong text-text-2",
      volt: "bg-volt text-volt-ink",
      "volt-outline": "border border-volt text-volt",
    },
    // sm and md are content-box, as the artboards draw their tool chips: 30px / 32px plus the 1px borders.
    size: {
      sm: "box-content h-7.5 px-2.5",
      md: "box-content h-8 px-3",
      lg: "px-3 py-2",
      meta: "px-3 py-2 type-mono-chip max-md:px-2 max-md:py-1.5",
      code: "px-2.5 py-1.5 type-mono-code",
    },
    text: { label: "", name: "type-mono-stack" },
  },
  defaultVariants: { tone: "outline", size: "md", text: "label" },
});

export function Chip<T extends ElementType = "span">({
  as,
  tone,
  size,
  text,
  className,
  ...rest
}: PolymorphicProps<T, { tone?: ChipTone; size?: ChipSize; text?: ChipText }>) {
  const Comp: ElementType = as ?? "span";
  return <Comp className={cn(chipVariants({ tone, size, text }), className)} {...rest} />;
}

interface ChipListProps {
  items: string[];
  tone?: ChipTone;
  size?: ChipSize;
  text?: ChipText;
  /** Accessible name for the list (e.g. "Stack"). Wins over `heading`. */
  label?: string;
  /** A visible mono label above the list. It names the list, so assistive tech hears it once. */
  heading?: string;
  className?: string;
}

/** A row of chips. With a `heading`, the label and the list are one block (the label is hidden from assistive tech; the list carries its name). */
export function ChipList({ items, tone, size, text, label, heading, className }: ChipListProps) {
  const list = (
    <ul aria-label={label ?? heading} className={cn("flex flex-wrap gap-2", !heading && className)}>
      {items.map((item) => (
        <li key={item}>
          <Chip tone={tone} size={size} text={text}>
            {item}
          </Chip>
        </li>
      ))}
    </ul>
  );
  if (!heading) return list;
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <MonoLabel aria-hidden="true" leading="font">
        {heading}
      </MonoLabel>
      {list}
    </div>
  );
}
