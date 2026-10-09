import { cn } from "@/lib/cn";

interface LEDMarqueeProps {
  /** Alternate the tones, as drawn: volt, then floodlight. */
  items: readonly { text: string; tone: "volt" | "floodlight" }[];
  /** Gives the strip a name for assistive tech. Without one the strip is hidden from it. */
  label?: string;
  className?: string;
}

/**
 * The far LED board (Tennis-Play): 600x30 on the night ground, a 1px line, 12px mono tracked .24em with 60px
 * between items. The items are drawn twice and the strip slides one copy to the left every 18s, so the loop has
 * no seam. Under reduced motion it stands still at frame 0. Decorative: the announcer and the visible panels
 * carry what it says, so with no `label` it is hidden from assistive tech.
 */
export function LEDMarquee({ items, label, className }: LEDMarqueeProps) {
  const named = label !== undefined;
  return (
    <div
      {...(named ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      className={cn(
        "box-content h-7.5 w-150 overflow-hidden border border-line bg-night",
        className,
      )}
    >
      <div className="flex h-full w-max animate-marquee items-center type-mono-brand whitespace-nowrap">
        {[0, 1].map((copy) => (
          // Each copy ends in the gap, so one copy is exactly the distance the strip slides.
          <div key={copy} aria-hidden="true" className="flex shrink-0 gap-15 pr-15">
            {items.map((item) => (
              <span
                key={item.text}
                data-part="item"
                className={item.tone === "volt" ? "text-volt" : "text-floodlight"}
              >
                {item.text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
