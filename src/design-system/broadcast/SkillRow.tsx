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

/** Name, bar and tier word. The bar is decorative here: the name and tier text already say it. */
export function SkillRow({ name, level, tierLabel, animate, className }: SkillRowProps) {
  return (
    <div className={cn("grid grid-cols-[130px_1fr_92px] items-center gap-3.5", className)}>
      <span className="type-mono-code text-floodlight">{name}</span>
      <SegmentBar level={level} label={`${name}: ${tierLabel}`} animate={animate} decorative />
      <span className={cn("text-right type-mono-xs", TIER[level])}>{tierLabel}</span>
    </div>
  );
}
