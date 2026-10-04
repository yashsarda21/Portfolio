import type { ElementType } from "react";
import type { PolymorphicProps } from "../lib/polymorphic";
import { BrandLockup } from "./BrandLockup";

type Own = {
  /** The brand mark, e.g. "YS". */
  mark: string;
  /** Crumbs after the hub, outermost first. The last one is the current page. */
  trail: string[];
  /** Text of the first crumb (default "HUB"). It is part of the link's accessible name. */
  hubLabel?: string;
  /** Accessible name of the nav landmark (default "Breadcrumb"). */
  label?: string;
  className?: string;
};

/**
 * "YS HUB / CRICKET GROUND / CAREER STATS". Only the first crumb (mark + hub label) is a link; pass `as` and
 * `to`/`href` for it. Below 768px only the mark shows; the trail stays readable to assistive tech.
 */
export function Breadcrumb<T extends ElementType = "a">({
  as,
  mark,
  trail,
  hubLabel = "HUB",
  label = "Breadcrumb",
  className,
  ...rest
}: PolymorphicProps<T, Own>) {
  const hubCurrent = trail.length === 0;
  return (
    <nav aria-label={label} className={className}>
      <ol className="flex items-center text-scout">
        <li>
          <BrandLockup
            as={(as ?? "a") as ElementType}
            mark={mark}
            label={hubLabel}
            labelClassName="max-md:sr-only"
            aria-current={hubCurrent ? "page" : undefined}
            {...rest}
          />
        </li>
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1;
          return [
            // The artboard's text is "HUB / X": a space on each side of the slash, tracked like the letters.
            <li
              key={`sep-${crumb}`}
              aria-hidden="true"
              className="type-mono-brand whitespace-pre max-md:sr-only"
            >
              {" / "}
            </li>,
            <li
              key={crumb}
              aria-current={last ? "page" : undefined}
              className="type-mono-brand max-md:sr-only"
            >
              {crumb}
            </li>,
          ];
        })}
      </ol>
    </nav>
  );
}
