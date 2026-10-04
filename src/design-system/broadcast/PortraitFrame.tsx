import { cva } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";
import { Text } from "../primitives/Text";

// The frame is 250px tall inside a 1px border (content-box: the artboard's height excludes it). The head shot
// is drawn at its artboard size, pinned to the bottom edge and centred; the frame clips the overflow.
const frame = cva("relative box-content h-62.5 overflow-hidden", {
  variants: {
    size: {
      // Badminton-Attributes: stand gradient in a hairline border, 320x258 image.
      attr: "border border-line bg-linear-180 from-stand-hi to-inset",
      // Player-Card: a volt glow rising from the foot and a volt hairline under it, 340x274 image.
      card: "border-b border-b-volt-a35 portrait-card-glow",
    },
  },
  defaultVariants: { size: "attr" },
});

const IMAGE = {
  attr: { width: 320, height: 258, className: "-ml-40 h-64.5 w-80" },
  card: { width: 340, height: 274, className: "-ml-42.5 h-68.5 w-85" },
} as const;

type PortraitFrameProps = {
  src: string;
  /** What the picture shows. Pass "" when the page already names the person next to it (a decorative copy). */
  alt: string;
  /** The position badge top left: a big value over a small label ("SE" / "POSITION"). */
  badge?: { value: string; label: string };
  size?: "attr" | "card";
  /** "lazy" for a frame below the fold (the phone). */
  loading?: "lazy" | "eager";
} & Omit<ComponentPropsWithRef<"div">, "children">;

/**
 * A head shot in its broadcast frame: gradient ground, hairline border, the image blended with `lighten`
 * (its black background drops out) and faded at the foot. Width and height are on the image, so it never
 * shifts the layout. The frame fills its parent's width.
 */
export function PortraitFrame({
  src,
  alt,
  badge,
  size = "attr",
  loading,
  className,
  ...rest
}: PortraitFrameProps) {
  const image = IMAGE[size];
  return (
    <div className={cn(frame({ size }), className)} {...rest}>
      <img
        src={src}
        alt={alt}
        width={image.width}
        height={image.height}
        loading={loading}
        decoding="async"
        className={cn(
          "absolute bottom-0 left-1/2 max-w-none portrait-fade object-cover mix-blend-lighten",
          image.className,
        )}
      />
      {badge ? (
        <>
          <Text variant="position" tone="volt" className="absolute top-2.5 left-3.5">
            {badge.value}
          </Text>
          <Text
            variant="mono-label"
            tone="label"
            leading="font"
            className="absolute top-16.5 left-4"
          >
            {badge.label}
          </Text>
        </>
      ) : null}
    </div>
  );
}
