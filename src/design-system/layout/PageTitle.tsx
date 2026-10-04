import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Heading, MonoLabel } from "../primitives/Text";

interface PageTitleProps {
  eyebrow: ReactNode;
  /** Gold only resolves inside a trophy zone (`data-zone="trophy"`). */
  eyebrowTone?: "volt" | "gold";
  title: ReactNode;
  /** Right slot: stat tiles, a legend or a line of text. Sits on the title's baseline row. */
  aside?: ReactNode;
  level?: 1;
  className?: string;
}

/** The page title block: mono eyebrow over the 84px display h1 (48px on mobile), with an optional right slot. */
export function PageTitle({
  eyebrow,
  eyebrowTone = "volt",
  title,
  aside,
  level = 1,
  className,
}: PageTitleProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-4", className)}>
      <div className="flex flex-col gap-1.5 max-md:gap-1">
        <MonoLabel variant="mono-kicker" tone={eyebrowTone}>
          {eyebrow}
        </MonoLabel>
        <Heading level={level} variant="title-page">
          {title}
        </Heading>
      </div>
      {aside ? <div className="flex items-end gap-0.5">{aside}</div> : null}
    </div>
  );
}
