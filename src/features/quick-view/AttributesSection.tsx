import { Chip, Heading, MonoLabel, SectionHeader } from "@/design-system";
import type { ScoutReport } from "./report";
import { SECTION_CLASS } from "./sectionClass";

export function AttributesSection({ attributes }: { attributes: ScoutReport["attributes"] }) {
  return (
    <section id="attributes" aria-labelledby="attributes-title" className={SECTION_CLASS}>
      <SectionHeader id="attributes-title" title={attributes.title} meta={attributes.meta} />
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(250px,100%),1fr))] gap-4">
        {attributes.groups.map((group) => (
          <li key={group.name} className="flex flex-col gap-3 border border-line p-4.5">
            <Heading level={3} variant="title-sm">
              {group.name}
            </Heading>
            <ul className="flex flex-wrap gap-2">
              {group.chips.map((chip) => (
                <li key={chip.label}>
                  <Chip size="code" tone={chip.filled ? "volt" : "strong"}>
                    {chip.label}
                  </Chip>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <MonoLabel variant="mono-xs" tone="dim" className="leading-3.75">
        {attributes.legend}
      </MonoLabel>
    </section>
  );
}
