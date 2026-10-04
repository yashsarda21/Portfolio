import { AutoGrid, Chip, FluidSection, Heading, MonoLabel, SectionHeader } from "@/design-system";
import type { ScoutReport } from "./report";

export function AttributesSection({ attributes }: { attributes: ScoutReport["attributes"] }) {
  return (
    <FluidSection id="attributes" aria-labelledby="attributes-title">
      <SectionHeader id="attributes-title" title={attributes.title} meta={attributes.meta} />
      <AutoGrid as="ul" min={250} className="gap-4">
        {attributes.groups.map((group) => (
          <li key={group.name} className="flex flex-col gap-3 border border-line p-4.5">
            <Heading level={3} variant="title-sm">
              {group.name}
            </Heading>
            <ul className="flex flex-wrap gap-2">
              {group.chips.map((chip) => (
                // flex: the chip stretches to the row, so filled and outlined chips share one height (as on the artboard).
                <li key={chip.label} className="flex">
                  <Chip size="code" tone={chip.filled ? "volt" : "strong"}>
                    {chip.label}
                  </Chip>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </AutoGrid>
      <MonoLabel variant="mono-xs" tone="dim" className="leading-auto">
        {attributes.legend}
      </MonoLabel>
    </FluidSection>
  );
}
