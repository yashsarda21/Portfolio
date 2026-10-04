import {
  autoGridVariants,
  FluidSection,
  Heading,
  HorizontalScroller,
  MonoLabel,
  SectionHeader,
  Text,
} from "@/design-system";
import { cn } from "@/lib/cn";
import type { ScoutReport } from "./report";

export function HighlightsSection({ highlights }: { highlights: ScoutReport["highlights"] }) {
  const { more } = highlights;
  return (
    <FluidSection id="highlights" aria-labelledby="highlights-title">
      <SectionHeader
        id="highlights-title"
        title={highlights.title}
        meta={
          <>
            <span className="max-md:hidden">{highlights.meta}</span>
            <span className="md:hidden">
              {highlights.swipe} <span aria-hidden="true">{highlights.next}</span>
            </span>
          </>
        }
      />
      <HorizontalScroller
        label={highlights.listLabel}
        listClassName={cn(
          autoGridVariants({ min: 300, from: "md" }),
          "md:gap-4 md:overflow-visible md:snap-none",
        )}
        fadeClassName="md:hidden"
      >
        {highlights.items.map((item) => (
          <li key={item.title} className="max-md:w-70 max-md:shrink-0 max-md:snap-start">
            <article
              className={cn(
                "flex h-full flex-col gap-3 border p-5 max-md:gap-1.5 max-md:p-3.5",
                item.featured ? "border-volt-a45 bg-volt-a04 max-md:bg-transparent" : "border-line",
              )}
            >
              <MonoLabel variant="mono-round" tone={item.featured ? "volt" : "label"}>
                {item.round}
                <span className="max-md:hidden">
                  {" "}
                  {item.sep} {item.tag}
                </span>
              </MonoLabel>
              <Heading level={3} variant="title">
                <span className="max-md:hidden">{item.title}</span>
                <span className="md:hidden">{item.shortTitle}</span>
              </Heading>
              <Text as="p" variant="body-copy" tone="secondary" className="max-md:hidden">
                {item.body}
              </Text>
              {item.short ? (
                <Text as="p" variant="caption" tone="secondary" className="leading-auto md:hidden">
                  {item.short}
                </Text>
              ) : null}
              <Text variant="mono-stack" tone="label" className="mt-auto max-md:hidden">
                {item.stackLine}
              </Text>
            </article>
          </li>
        ))}
      </HorizontalScroller>
      <a href={more.href} className="type-mono-nav text-volt hover:text-volt-hover max-md:hidden">
        {more.label} <span aria-hidden="true">{more.glyph}</span>
      </a>
    </FluidSection>
  );
}
