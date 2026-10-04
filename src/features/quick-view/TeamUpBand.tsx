import { Heading, LinkRow, MonoLabel } from "@/design-system";
import type { ScoutReport } from "./report";

export function TeamUpBand({ teamUp }: { teamUp: ScoutReport["teamUp"] }) {
  return (
    <section
      id="teamup"
      aria-labelledby="teamup-title"
      className="mb-15 grid scroll-mt-20 grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))] items-end gap-9 bg-volt px-[clamp(20px,4vw,56px)] py-12 text-volt-ink max-md:mb-0 max-md:py-8"
    >
      <div className="flex flex-col gap-3">
        <MonoLabel variant="mono-eyebrow" tone="ink-2" className="leading-[normal]">
          {teamUp.eyebrow}
        </MonoLabel>
        <Heading level={2} variant="band" tone="ink" id="teamup-title">
          {teamUp.headline}
        </Heading>
      </div>
      <div className="flex flex-col gap-0.5">
        {teamUp.links.map((link) => (
          <LinkRow
            key={link.label}
            href={link.href}
            glyph={link.glyph}
            download={link.download}
            className="min-h-14.25 last:min-h-14"
          >
            {link.label}
          </LinkRow>
        ))}
      </div>
    </section>
  );
}
