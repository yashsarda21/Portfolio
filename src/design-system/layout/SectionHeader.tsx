import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Heading, MonoLabel } from "../primitives/Text";

type SectionHeaderProps = {
  title: ReactNode;
  /** Small mono label on the right (dates, counts). */
  meta?: ReactNode;
  size?: "lg" | "md";
  level?: 2 | 3;
  id?: string;
  className?: string;
};

/** Section title row: big display heading, optional mono meta, hairline underneath on desktop. */
export function SectionHeader({
  title,
  meta,
  size = "lg",
  level = 2,
  id,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-2.5 border-b border-line pb-3.5 max-md:items-baseline max-md:border-b-0 max-md:pb-0",
        className,
      )}
    >
      <Heading level={level} variant={size === "lg" ? "section" : "section-sm"} id={id}>
        {title}
      </Heading>
      {meta ? <MonoLabel variant="mono-meta">{meta}</MonoLabel> : null}
    </div>
  );
}
