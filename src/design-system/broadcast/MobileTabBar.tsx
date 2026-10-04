import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "../primitives/Icon";
import type { IconName } from "../primitives/icons";

interface MobileTabBarItem {
  key: string;
  label: string;
  icon: IconName;
  /** Plain link target. For a router link, pass `as` and `to` instead. */
  href?: string;
  to?: string;
  as?: ElementType;
  current?: boolean;
}

interface MobileTabBarProps {
  /** Accessible name for the nav landmark (e.g. "Main"). */
  label: string;
  items: MobileTabBarItem[];
  className?: string;
}

/**
 * Mobile-only main navigation pinned to the bottom edge: 76px plus the iOS home-indicator inset (A9).
 * The current item is volt and carries aria-current="page".
 */
export function MobileTabBar({ label, items, className }: MobileTabBarProps) {
  return (
    <nav
      aria-label={label}
      // base.css reads this to keep focused elements clear of the bar (scroll-padding-bottom).
      data-bottom-actions=""
      className={cn(
        // box-content: the artboard's 76px height excludes its 1px top border.
        "fixed inset-x-0 bottom-0 z-30 box-content grid h-19 grid-cols-5 border-t border-line bg-tabbar pb-[env(safe-area-inset-bottom)] md:hidden",
        className,
      )}
    >
      {items.map(({ key, label: text, icon, href, to, as, current }) => {
        const Comp: ElementType = as ?? "a";
        return (
          <Comp
            key={key}
            {...(href !== undefined ? { href } : {})}
            {...(to !== undefined ? { to } : {})}
            {...(current ? { "aria-current": "page" } : {})}
            className={cn(
              "flex flex-col items-center justify-center gap-1.25 focus-visible:-outline-offset-4",
              current ? "text-volt" : "text-scout",
            )}
          >
            <Icon name={icon} size={20} />
            <span className="type-mono-xs">{text}</span>
          </Comp>
        );
      })}
    </nav>
  );
}
