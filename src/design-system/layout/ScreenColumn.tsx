import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Where the column gives way to the Stage: it is hidden from this width up (the Stage's `from`, the other way round). */
const UNTIL = { md: "md:hidden", lg: "lg:hidden" } as const;

interface ScreenColumnProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The width from which the Stage takes over and the column hides: "md" (768px) or "lg" (1200px). */
  until: keyof typeof UNTIL;
  /** The scene behind the column, e.g. <ArenaBackdrop layout="column" />. */
  backdrop?: ReactNode;
  /** The row across the top: the brand lockup and the controls. */
  top: ReactNode;
  /** The screen's content (the scoreboard). It and the actions form one group, centred under the top row. */
  children: ReactNode;
  /** The calls to action, set a fixed gap under the content: 40px on a phone, 56px from a tablet. */
  actions: ReactNode;
}

/**
 * The phone's frame for a cinematic screen (Mobile-Landing): a flex column at least one screen tall, so a
 * short phone scrolls instead of clipping, over its own backdrop. 16px gutters, 640px wide at most and centred.
 * The content and the actions are one group under the top row: the actions a fixed gap below the content (40px,
 * 56px from a tablet), the group centred in what the top row leaves, and never closer to the top row than 56px,
 * the strip the backdrop's floodlights hang in (the column backdrop's banks end 14px short of it). Slots:
 * `top` (data-part="top"), `children`, `actions`. Pass the Stage's counterpart as `until`.
 */
export function ScreenColumn({
  until,
  backdrop,
  top,
  children,
  actions,
  className,
  ...rest
}: ScreenColumnProps) {
  return (
    <div
      data-venue="turf"
      {...rest}
      className={cn("relative flex min-h-dvh flex-col bg-night", UNTIL[until], className)}
    >
      {backdrop}
      <div className="relative mx-auto flex w-full max-w-160 flex-1 flex-col px-4 pt-4 pb-10">
        <div data-part="top" className="flex items-center justify-between gap-2">
          {top}
        </div>
        <div className="flex flex-1 flex-col justify-center pt-14">
          {children}
          <div className="mt-10 flex flex-col gap-3 md:mt-14">{actions}</div>
        </div>
      </div>
    </div>
  );
}
