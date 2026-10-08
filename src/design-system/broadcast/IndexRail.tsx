import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { linkProps, type LinkTarget } from "../lib/link";
import { MonoLabel } from "../primitives/Text";

interface IndexRailLink extends LinkTarget {
  key: string;
  label: string;
  /** The small word at the end of the row ("SEEN", "PROJECTS"). */
  tag: string;
  /** Visited: the tag turns volt. */
  seen: boolean;
}

interface IndexRailProps {
  /** The navigation landmark's name. */
  label: string;
  /** The small heading above the links. */
  title: string;
  links: IndexRailLink[];
  /** Above the index (the matchday card). */
  header?: ReactNode;
  /** Pinned to the bottom (the hidden achievements). */
  footer?: ReactNode;
  className?: string;
}

/** A small labelled block of the rail: a mono label over its content. */
export function RailSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <MonoLabel>{label}</MonoLabel>
      {children}
    </div>
  );
}

/**
 * The Hub's full index: every page, with a SEEN tag on those visited. It has no surface or padding of its own:
 * the page gives it glass on the desktop rail and plain ground inside the drawer.
 */
export function IndexRail({ label, title, links, header, footer, className }: IndexRailProps) {
  return (
    <div className={cn("flex flex-col gap-4.5", className)}>
      {header}
      <nav aria-label={label} className="flex flex-col gap-0.5 border-t border-line pt-3.5">
        <MonoLabel className="mb-1.5">{title}</MonoLabel>
        {links.map(({ key, label: text, tag, seen, ...target }) => {
          const { as: Comp, ...attrs } = linkProps(target);
          return (
            <Comp
              key={key}
              className="flex min-h-11 items-center justify-between gap-2 px-2.5 type-body-md text-floodlight transition-colors duration-(--dur-snap) ease-snap hover:bg-white-a05"
              {...attrs}
            >
              <span className="min-w-0">{text}</span>
              <span
                {...(seen ? { "data-seen": "" } : {})}
                className={cn(
                  "shrink-0 type-mono-note whitespace-nowrap",
                  seen ? "text-volt" : "text-dim",
                )}
              >
                {tag}
              </span>
            </Comp>
          );
        })}
      </nav>
      {footer ? <div className="mt-auto border-t border-line pt-3.5">{footer}</div> : null}
    </div>
  );
}
