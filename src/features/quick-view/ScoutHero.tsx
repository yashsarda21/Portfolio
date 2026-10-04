import { Fragment } from "react";
import { Button, Chip, Heading, MonoLabel } from "@/design-system";
import type { ScoutReport } from "./report";

export function ScoutHero({ hero }: { hero: ScoutReport["hero"] }) {
  const { primary, secondary } = hero;
  return (
    <section
      aria-labelledby="scout-title"
      className="flex flex-col gap-6.5 pt-20 max-md:gap-4 max-md:pt-6"
    >
      <MonoLabel variant="mono-kicker" tone="volt">
        {hero.eyebrow}
        <span className="max-md:hidden">
          {" "}
          {hero.sep} {hero.eyebrowMore}
        </span>
      </MonoLabel>
      <Heading level={1} variant="hero-fluid" id="scout-title">
        {hero.nameParts.map((part, i) => (
          <Fragment key={part}>
            {i > 0 ? " " : null}
            <span className="max-md:block">{part}</span>
          </Fragment>
        ))}
      </Heading>
      <p className="max-w-215 type-lede text-text-1 md:text-pretty">
        <span className="max-md:hidden">{hero.summary}</span>
        <span className="md:hidden">{hero.summaryShort}</span>
      </p>
      <ul className="flex flex-wrap gap-2.5 max-md:gap-1.5">
        {hero.chips.map((chip) => (
          <li key={chip.label} className={chip.desktopOnly ? "max-md:hidden" : undefined}>
            <Chip size="meta" tone={chip.highlight ? "volt-outline" : "meta"}>
              {chip.short ? (
                <>
                  <span className="max-md:hidden">{chip.label}</span>
                  <span className="md:hidden">{chip.short}</span>
                </>
              ) : (
                chip.label
              )}
            </Chip>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3.5 max-md:hidden">
        <Button
          as="a"
          href={primary.href}
          size="cta"
          skew={false}
          glow={false}
          {...(primary.newTab ? { target: "_blank", rel: "noopener" } : {})}
        >
          {primary.label}
          {primary.newTab ? <span className="sr-only"> {hero.newTabHint}</span> : null}
        </Button>
        <Button as="a" href={secondary.href} variant="outline" size="cta" skew={false}>
          {secondary.label}
        </Button>
      </div>
    </section>
  );
}
