import { AutoGrid, FluidSection, Heading, LinkRow, MonoLabel } from "@/design-system";
import type { ScoutReport } from "./report";

export function TeamUpBand({ teamUp }: { teamUp: ScoutReport["teamUp"] }) {
  return (
    <FluidSection
      id="teamup"
      aria-labelledby="teamup-title"
      divided={false}
      className="mb-15 max-md:mb-10"
    >
      <AutoGrid
        min={380}
        className="items-end gap-9 bg-volt px-[clamp(20px,4vw,56px)] py-12 text-volt-ink max-md:py-8"
      >
        <div className="flex flex-col gap-3">
          <MonoLabel variant="mono-eyebrow" tone="ink-2" leading="font">
            {teamUp.eyebrow}
          </MonoLabel>
          <Heading level={2} variant="band" tone="ink" id="teamup-title">
            {teamUp.headline}
          </Heading>
        </div>
        <div className="flex flex-col gap-0.5">
          {teamUp.links.map((link) => (
            <LinkRow key={link.label} href={link.href} glyph={link.glyph} download={link.download}>
              {link.label}
            </LinkRow>
          ))}
        </div>
      </AutoGrid>
    </FluidSection>
  );
}
