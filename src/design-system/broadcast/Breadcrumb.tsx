import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
import { BrandLockup } from "./BrandLockup";

type Own = {
  /** The brand mark, e.g. "YS". */
  mark: string;
  /** Crumbs after the hub, outermost first. The last one is the current page. */
  trail: string[];
  /** Text of the first crumb (e.g. "HUB"). It is part of the link's accessible name. */
  hubLabel: string;
  /** Accessible name of the nav landmark (e.g. "Breadcrumb"). */
  label: string;
  className?: string;
};

/**
 * "YS HUB / CRICKET GROUND / CAREER STATS". Only the first crumb (mark + hub label) is a link; pass `as` and
 * `to`/`href` for it. Below 768px only the mark shows (36px, a size down). Below 1024px only the hub and the
 * current page show, so a long trail never crowds the buttons beside it. Whatever is not shown stays readable to
 * assistive tech.
 */
export function Breadcrumb<T extends ElementType = "a">({
  as,
  mark,
  trail,
  hubLabel,
  label,
  className,
  ...rest
}: PolymorphicProps<T, Own>) {
  const hubCurrent = trail.length === 0;
  return (
    <nav aria-label={label} className={className}>
      <ol className="flex items-center whitespace-nowrap text-scout">
        <li>
          <BrandLockup
            as={(as ?? "a") as ElementType}
            mark={mark}
            size="fluid"
            label={hubLabel}
            labelClassName="max-md:sr-only"
            aria-current={hubCurrent ? "page" : undefined}
            {...rest}
          />
        </li>
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1;
          // The middle of a long trail steps aside below 1024px (the hub and the current page stay).
          const middle = last ? "" : "max-lg:sr-only";
          // The trail is fixed, so the index is a stable key (two crumbs may read the same).
          return [
            // The artboard's text is "HUB / X": a space on each side of the slash, tracked like the letters.
            <li
              key={`sep-${i}`}
              aria-hidden="true"
              className={cn("type-mono-brand whitespace-pre max-md:sr-only", middle)}
            >
              {" / "}
            </li>,
            <li
              key={`crumb-${i}`}
              aria-current={last ? "page" : undefined}
              className={cn("type-mono-brand max-md:sr-only", middle)}
            >
              {crumb}
            </li>,
          ];
        })}
      </ol>
    </nav>
  );
}
