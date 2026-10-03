import { cn } from "@/lib/cn";
import { ICONS, type IconName } from "./icons";

interface IconProps {
  name: IconName;
  /** Rendered width/height in px (default 18). */
  size?: number;
  strokeWidth?: number;
  /** Give a title only when the icon carries meaning on its own. */
  title?: string;
  className?: string;
}

export function Icon({ name, size = 18, strokeWidth, title, className }: IconProps) {
  const def = ICONS[name];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth ?? def.sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      className={cn("shrink-0", className)}
      {...(title ? { role: "img" } : { "aria-hidden": true })}
    >
      {title ? <title>{title}</title> : null}
      {def.body}
    </svg>
  );
}
