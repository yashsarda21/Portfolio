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
  /** The screen's content (the scoreboard). It starts where the top row ends; place it with its own margin. */
  children: ReactNode;
  /** The calls to action, pinned to the foot of the column on a phone and set under the content on a tablet. */
  actions: ReactNode;
}

/**
 * The phone's frame for a cinematic screen (Mobile-Landing): a flex column at least one screen tall, so a
 * short phone scrolls instead of clipping, over its own backdrop. 16px gutters, 640px wide at most and centred
 * on a tablet, where the content and the actions sit together in the middle of what the top row leaves.
 * Slots: `top`, `children`, `actions`. Pass the Stage's counterpart as `until`.
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
        <div className="flex items-center justify-between gap-2">{top}</div>
        <div className="flex flex-1 flex-col md:justify-center md:py-8">
          {children}
          <div className="mt-auto flex flex-col gap-3 pt-6 md:mt-14 md:pt-0">{actions}</div>
        </div>
      </div>
    </div>
  );
}
