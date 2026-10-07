import { cn } from "@/lib/cn";
import { SkyGlow } from "./SkyGlow";

/**
 * The scene behind a single exhibit (the Player Card): the sky's cool light from the top edge, a pool
 * of volt at the centre, and a floor lying back under the exhibit, 700px down on the 900px board (its foot
 * runs 100px past the bottom edge). Decorative: put it in a page's `backdrop`.
 */
export function ShowcaseBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" data-showcase="" className={cn("absolute inset-0", className)}>
      <div className="absolute inset-0 scene-centre-glow" />
      <SkyGlow x="50%" y="-10%" w="60%" h="40%" alpha={0.14} />
      <div className="absolute inset-x-0 -bottom-25 h-75 perspective-floor">
        <div className="mx-auto h-125 w-225 scene-floor" />
      </div>
    </div>
  );
}
