import { cn } from "@/lib/cn";
import { SegmentBar } from "./SegmentBar";

const TIER = { shipped: "text-volt", built: "text-floodlight", kit: "text-dim" } as const;

interface SkillRowProps {
  name: string;
  level: "shipped" | "built" | "kit";
  tierLabel: string;
  animate?: boolean;
  className?: string;
}

/**
 * Name, bar and tier word. The bar is decorative here: the name and tier text already say it.
 * Wide (a 336px row or more) it is the artboard's three columns, 130px | bar | 92px. Narrower, the bar drops
 * below the name and the tier, so it never shrinks to a stub. The row answers its own width, not the window's.
 */
export function SkillRow({ name, level, tierLabel, animate, className }: SkillRowProps) {
  return (
    <div className={cn("@container", className)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-1.5 @min-[21rem]:grid-cols-[130px_minmax(0,1fr)_92px]">
        {/* The font's own line box (leading-auto): the artboard sets no line-height here, so the row is 17px tall. */}
        <span className="type-mono-code leading-auto text-floodlight">{name}</span>
        <SegmentBar
          level={level}
          label={`${name}: ${tierLabel}`}
          animate={animate}
          decorative
          className="col-span-2 row-start-2 @min-[21rem]:col-span-1 @min-[21rem]:col-start-2 @min-[21rem]:row-start-1"
        />
        <span
          className={cn(
            "col-start-2 row-start-1 text-right type-mono-xs leading-auto @min-[21rem]:col-start-3",
            TIER[level],
          )}
        >
          {tierLabel}
        </span>
      </div>
    </div>
  );
}
