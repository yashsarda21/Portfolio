import { AutoGrid, FluidSection, Heading, MonoLabel, SectionHeader, Text } from "@/design-system";
import { cn } from "@/lib/cn";
import type { ScoutReport } from "./report";

export function CareerSection({ career, sep }: { career: ScoutReport["career"]; sep: string }) {
  return (
    <FluidSection id="career" aria-labelledby="career-title">
      <SectionHeader
        id="career-title"
        title={career.title}
        meta={
          <>
            <span className="max-md:hidden">{career.meta}</span>
            <span className="md:hidden">{career.metaShort}</span>
          </>
        }
      />
      <div className="flex flex-col gap-5.5 max-md:gap-2.5">
        {career.rows.map((row) => (
          <AutoGrid
            as="article"
            key={row.span}
            min={300}
            className={cn(
              "gap-x-10 gap-y-3 border-b border-line py-4.5 max-md:block max-md:border-b-0 max-md:py-0",
              !row.isCurrent && "max-md:opacity-75",
            )}
          >
            <div className="flex flex-col gap-1.5 max-md:gap-0.5">
              <MonoLabel variant="mono-date" tone={row.isCurrent ? "volt" : "label"}>
                {row.span} {sep} {row.status}
              </MonoLabel>
              <Heading level={3} variant="title-lg">
                <span className="max-md:hidden">{row.team}</span>
                <span className="md:hidden">{row.compactTitle}</span>
              </Heading>
              <Text variant="body" tone="secondary" className="leading-auto max-md:hidden">
                {row.roleLine}
              </Text>
              {row.compactLine ? (
                <Text variant="body-sm" tone="secondary" className="leading-auto md:hidden">
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
          </AutoGrid>
        ))}
      </div>
    </FluidSection>
  );
}
