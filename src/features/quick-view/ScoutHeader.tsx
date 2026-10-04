import { BrandLockup, FluidContainer, HUDButton, MonoLabel, Text } from "@/design-system";
import { ArenaLink } from "@/shell/ArenaLink";
import type { ScoutReport } from "./report";

export function ScoutHeader({ header }: { header: ScoutReport["header"] }) {
  return (
    // max-md:-mb-px: the artboard puts the hero 24px below the 60px header row, not below its 1px border.
    <header className="sticky top-0 z-20 border-b border-line bar max-md:-mb-px max-md:bg-ground-a92 md:backdrop-blur-glass">
      <FluidContainer className="flex min-h-17 flex-wrap items-center justify-between gap-5 max-md:h-15 max-md:min-h-0">
        <div className="flex items-center gap-3">
          <BrandLockup size="md" mark={header.mark} className="max-md:hidden" />
          <MonoLabel variant="mono-kicker" leading="font">
            {header.label}
          </MonoLabel>
        </div>
        <nav aria-label={header.navLabel} className="flex flex-wrap gap-5.5 max-md:hidden">
          {header.nav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="type-mono-nav text-text-2 hover:text-floodlight"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <HUDButton
          as={ArenaLink}
          to={header.enter.to}
          tone="volt-outline"
          className="max-md:hidden"
        >
          {header.enter.label}
        </HUDButton>
        <Text
          as={ArenaLink}
          to={header.enter.to}
          variant="mono-xs"
          tone="volt"
          leading="font"
          className="inline-flex h-11 items-center hover:text-volt-hover md:hidden"
        >
          <span>
            {header.enterShort} <span aria-hidden="true">{header.next}</span>
          </span>
        </Text>
      </FluidContainer>
    </header>
  );
}
