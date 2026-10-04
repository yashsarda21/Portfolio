import { Fragment } from "react";
import { ui } from "@/content";
import { Button, Chip, Heading, MonoLabel } from "@/design-system";
import type { ScoutReport } from "./report";

/** Screen-reader note for a link that leaves the page in a new tab. */
export function NewTabHint() {
  return <span className="sr-only"> {ui.scout.newTab}</span>;
}

export function ScoutHero({ hero }: { hero: ScoutReport["hero"] }) {
  const { primary, secondary } = hero;
  return (
    <section
      aria-labelledby="scout-title"
      className="flex flex-col gap-6.5 pt-20 max-md:gap-4 max-md:pt-5.75"
    >
      <MonoLabel
        variant="mono-eyebrow"
        tone="volt"
        className="leading-[normal] max-md:type-mono-label max-md:leading-3.25"
      >
        {hero.eyebrow}
        <span className="max-md:hidden">
          {" "}
          {hero.sep} {hero.eyebrowMore}
        </span>
      </MonoLabel>
      <Heading level={1} variant="hero-fluid" id="scout-title" className="max-md:tracking-[normal]">
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
      <ul className="flex flex-wrap gap-2.5 max-md:gap-1.25">
        {hero.chips.map((chip) => (
          <li key={chip.label} className={chip.desktopOnly ? "max-md:hidden" : undefined}>
            <Chip
              size="meta"
              tone={chip.highlight ? "volt-outline" : "meta"}
              className="leading-[normal] max-md:py-[5.5px]"
            >
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
          {primary.newTab ? <NewTabHint /> : null}
        </Button>
        <Button
          as="a"
          href={secondary.href}
          variant="outline"
          size="cta"
          skew={false}
          className="min-h-14.5"
        >
          {secondary.label}
        </Button>
      </div>
    </section>
  );
}
