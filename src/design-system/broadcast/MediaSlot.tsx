import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LiveDot } from "./LiveDot";

interface MediaSlotProps {
  /** Placeholder text, or the video's accessible name when media is set. */
  label: string;
  /** Top-left chip text (e.g. REPLAY); a live dot is added. Decorative. */
  badge: ReactNode;
  /** Top-right volt chip (e.g. THE FINAL). Decorative. */
  round: string;
  /** A screen recording. `null` (or omitted) shows the striped placeholder. */
  media?: { src: string; captions?: string; poster?: string } | null;
  className?: string;
}

const CHIP = "absolute top-3.5 bg-ground px-2.5 py-1.5";

/** The replay window: a striped placeholder until a recording exists, then a muted video with captions. */
export function MediaSlot({ label, badge, round, media = null, className }: MediaSlotProps) {
  return (
    // box-content: the artboard's 230px height excludes its 1px border.
    <div
      className={cn(
        "relative box-content h-57.5 overflow-hidden border border-line",
        media ? "bg-inset" : "flex items-center justify-center media-stripes",
        className,
      )}
    >
      {media ? (
        <video
          muted
          controls
          playsInline
          preload="metadata"
          poster={media.poster}
          src={media.src}
          aria-label={label}
          className="size-full object-cover"
        >
          {/* Always present so assistive tech and axe see a captions track; the replays are silent. */}
          <track kind="captions" src={media.captions} srcLang="en" label="English" />
        </video>
      ) : (
        <>
          <p className="px-4 text-center type-mono-nav text-dim">{label}</p>
          <span
            aria-hidden="true"
            className={cn(CHIP, "left-3.5 flex items-center gap-2 type-mono-label")}
          >
            <LiveDot size={6} />
            {badge}
          </span>
          <span aria-hidden="true" className={cn(CHIP, "right-3.5 type-mono-round text-volt")}>
            {round}
          </span>
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-line">
            <span className="block h-1 w-38/100 bg-volt" />
          </div>
        </>
      )}
    </div>
  );
}
