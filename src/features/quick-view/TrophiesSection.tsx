import { AutoGrid, FluidSection, SectionHeader, Text } from "@/design-system";
import type { ScoutReport } from "./report";

export function TrophiesSection({
  trophies,
  academy,
}: {
  trophies: ScoutReport["trophies"];
  academy: ScoutReport["academy"];
}) {
  return (
    <FluidSection id="trophies" aria-labelledby="trophies-title">
      <AutoGrid min={360} className="gap-10">
        <div className="flex flex-col gap-4">
          <SectionHeader id="trophies-title" size="md" title={trophies.title} />
          <ul className="flex flex-col gap-4">
            {trophies.rows.map((row) => (
              <li
                key={row.title}
                className="flex justify-between gap-4 border-b border-line py-2.5 max-md:flex-col max-md:gap-1"
              >
                <Text variant="body" tone="primary" leading="font" className="shrink-0">
                  {row.title}
                </Text>
                <Text
                  variant="mono-stack"
                  tone="label"
                  caps
                  className="text-right max-md:text-left"
                >
                  {row.sub}
                </Text>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-4">
          <SectionHeader id="academy-title" size="md" title={academy.title} />
          <div className="flex flex-col gap-1 border-b border-line py-2.5">
            <Text variant="body-lg" leading="font" className="font-semibold">
              {academy.school}
            </Text>
            <Text variant="body-md" tone="secondary" leading="font">
              {academy.degreeLine}
            </Text>
            <Text variant="mono-stack" tone="label" caps>
              {academy.datesLine}
            </Text>
          </div>
        </div>
      </AutoGrid>
    </FluidSection>
  );
}
