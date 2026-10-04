import { BrandLockup, HUDButton, MonoLabel } from "@/design-system";
import { ArenaLink } from "@/shell/ArenaLink";
import type { ScoutReport } from "./report";

export function ScoutHeader({ header }: { header: ScoutReport["header"] }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bar max-md:bg-ground-a92 md:backdrop-blur-glass">
      <div className="mx-auto flex min-h-17 max-w-312 flex-wrap items-center justify-between gap-5 px-6 max-md:h-15 max-md:min-h-0 max-md:px-4">
        <div className="flex items-center gap-3">
          <BrandLockup size="md" mark={header.mark} className="max-md:hidden" />
          <MonoLabel variant="mono-eyebrow" className="max-md:type-mono-label">
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
          className="h-11.5 max-md:hidden"
        >
          {header.enter.label}
        </HUDButton>
        <ArenaLink
          to={header.enter.to}
          className="inline-flex h-11 items-center type-mono-xs text-volt hover:text-volt-hover md:hidden"
        >
          <span>
            {header.enterShort} <span aria-hidden="true">{header.next}</span>
          </span>
        </ArenaLink>
      </div>
    </header>
  );
}
