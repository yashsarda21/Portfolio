import { SectionHeader, Text } from "@/design-system";
import type { ScoutReport } from "./report";

export function TrophiesSection({
  trophies,
  academy,
}: {
  trophies: ScoutReport["trophies"];
  academy: ScoutReport["academy"];
}) {
  return (
    <section
      id="trophies"
      aria-labelledby="trophies-title"
      className="grid scroll-mt-20 grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] gap-10 max-md:border-t max-md:border-line max-md:pt-4"
    >
      <div className="flex flex-col gap-4">
        <SectionHeader id="trophies-title" size="md" title={trophies.title} />
        <ul className="flex flex-col gap-4">
          {trophies.rows.map((row) => (
            <li key={row.title} className="flex justify-between gap-4 border-b border-line py-2.5">
              <Text variant="body" tone="primary" className="leading-[normal]">
                {row.title}
              </Text>
              <Text
                variant="mono-stack"
                tone="label"
                className="text-right leading-[normal] uppercase"
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
          <Text variant="body-lg" className="font-semibold leading-[normal]">
            {academy.school}
          </Text>
          <Text variant="body-md" tone="secondary" className="leading-[normal]">
            {academy.degreeLine}
          </Text>
          <Text variant="mono-stack" tone="label" className="leading-[normal] uppercase">
            {academy.datesLine}
          </Text>
        </div>
      </div>
    </section>
  );
}
