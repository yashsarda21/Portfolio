import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Heading, MonoLabel, Text } from "../primitives/Text";

interface PageTitleProps {
  eyebrow: ReactNode;
  /** Gold only resolves inside a trophy zone (`data-zone="trophy"`). */
  eyebrowTone?: "volt" | "gold";
  title: ReactNode;
  /** "xl" is the 96px title (Team Up); the default is 84px. */
  size?: "default" | "xl";
  /** A line under the title (Team Up's invitation): 20px, up to 640px wide. */
  lede?: ReactNode;
  /** Right slot: stat tiles, a legend or a line of text. Sits on the title's baseline row. */
  aside?: ReactNode;
  level?: 1;
  className?: string;
}

/** The page title block: mono eyebrow over the 84px display h1 (48px on mobile), with an optional line under it and right slot. */
export function PageTitle({
  eyebrow,
  eyebrowTone = "volt",
  title,
  size = "default",
  lede,
  aside,
  level = 1,
  className,
}: PageTitleProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-4", className)}>
      <div className={cn("flex flex-col max-md:gap-1", size === "xl" ? "gap-2" : "gap-1.5")}>
        <MonoLabel variant="mono-kicker" tone={eyebrowTone}>
          {eyebrow}
        </MonoLabel>
        <Heading level={level} variant={size === "xl" ? "d0" : "d1"}>
          {title}
        </Heading>
        {lede ? (
          <Text as="p" variant="body-intro" tone="secondary" className="max-w-160">
            {lede}
          </Text>
        ) : null}
      </div>
      {aside ? <div className="flex items-stretch gap-0.5 max-md:w-full">{aside}</div> : null}
    </div>
  );
}
