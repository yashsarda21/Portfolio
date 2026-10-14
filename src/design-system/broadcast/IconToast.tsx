import { cn } from "@/lib/cn";
import { Glass } from "../primitives/Glass";
import { Icon } from "../primitives/Icon";
import type { IconName } from "../primitives/icons";

interface IconToastProps {
  icon: IconName;
  eyebrow: string;
  title: string;
  /** `data-*` attributes for the eyebrow's own span: a page marks it while the words it carries are still loading. */
  eyebrowProps?: Record<`data-${string}`, string | undefined>;
  /** Names the part for a test or a stylesheet. */
  "data-part"?: string;
  className?: string;
}

/**
 * A banner of news: a volt tile holding an icon, then a glass body with a mono eyebrow over a heavy title (Easter-Egg's
 * achievement toast; Full Time's "MATCHDAY COMPLETE / FULL TIME"). The eyebrow and title are text for assistive tech;
 * the icon is decoration. It sits where its page puts it; a page that wants it to drop in gives it `animate-drop`.
 */
export function IconToast({
  icon,
  eyebrow,
  title,
  eyebrowProps,
  className,
  ...rest
}: IconToastProps) {
  return (
    <div className={cn("flex items-stretch shadow-toast", className)} {...rest}>
      <span
        aria-hidden="true"
        className="flex w-16 shrink-0 items-center justify-center bg-volt text-volt-ink"
      >
        <Icon name={icon} size={28} />
      </span>
      <Glass className="flex min-w-0 grow flex-col justify-center gap-0.5 px-5.5 py-3">
        <span {...eyebrowProps} className="type-mono-toast text-balance text-volt">
          {eyebrow}
        </span>
        <span className="type-title-toast">{title}</span>
      </Glass>
    </div>
  );
}
