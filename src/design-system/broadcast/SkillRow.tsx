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

export function SkillRow({ name, level, tierLabel, animate, className }: SkillRowProps) {
  return (
    <div className={cn("grid grid-cols-[130px_1fr_92px] items-center gap-3.5", className)}>
      <span className="tracking-normal type-mono-md text-floodlight normal-case">{name}</span>
      <SegmentBar level={level} label={`${name}: ${tierLabel}`} animate={animate} />
      <span className={cn("text-right type-mono-tag", TIER[level])}>{tierLabel}</span>
    </div>
  );
}
