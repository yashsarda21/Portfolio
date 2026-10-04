import { Heading, MonoLabel, SectionHeader, Text } from "@/design-system";
import { cn } from "@/lib/cn";
import type { ScoutReport } from "./report";
import { SECTION_CLASS } from "./sectionClass";

export function CareerSection({ career, sep }: { career: ScoutReport["career"]; sep: string }) {
  return (
    <section
      id="career"
      aria-labelledby="career-title"
      className={cn(SECTION_CLASS, "max-md:gap-2.25")}
    >
      <SectionHeader
        id="career-title"
        className="max-md:[&>h2]:leading-[normal]"
        title={career.title}
        meta={
          <>
            <span className="max-md:hidden">{career.meta}</span>
            <span className="type-mono-stack leading-[normal] md:hidden">{career.metaShort}</span>
          </>
        }
      />
      <div className="flex flex-col gap-5.5 max-md:gap-2.25">
        {career.rows.map((row) => (
          <article
            key={row.span}
            className={cn(
              "grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-x-10 gap-y-3 border-b border-line py-4.5",
              "max-md:block max-md:border-b-0 max-md:py-0",
              !row.isCurrent && "max-md:opacity-75",
            )}
          >
            <div className="flex flex-col gap-1.5 max-md:gap-0.5">
              <MonoLabel
                variant="mono-chip"
                tone={row.isCurrent ? "volt" : "label"}
                className="leading-[normal]"
              >
                {row.span} {sep} {row.status}
              </MonoLabel>
              <Heading level={3} variant="title-lg" className="max-md:leading-[normal]">
                <span className="max-md:hidden">{row.team}</span>
                <span className="md:hidden">{row.compactTitle}</span>
              </Heading>
              <Text variant="body" tone="secondary" className="leading-[normal] max-md:hidden">
                {row.roleLine}
              </Text>
              {row.compactLine ? (
                <Text variant="body-sm" tone="secondary" className="leading-[normal] md:hidden">
                  {row.compactLine}
                </Text>
              ) : null}
              <Text variant="mono-stack" tone="label" className="max-md:hidden">
                {row.stackLine}
              </Text>
            </div>
            <ul className="flex list-disc flex-col gap-2 pl-4.5 type-body text-text-1 max-md:hidden">
              {row.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
