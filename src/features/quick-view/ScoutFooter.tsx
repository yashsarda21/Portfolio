import { FluidContainer } from "@/design-system";
import { ArenaLink } from "@/shell/ArenaLink";
import type { ScoutReport } from "./report";

export function ScoutFooter({ footer }: { footer: ScoutReport["footer"] }) {
  return (
    // max-md:pb-36 clears the fixed bottom action bar.
    <FluidContainer
      as="footer"
      className="relative flex flex-wrap justify-between gap-3 pb-12 type-mono-nav text-dim max-md:pb-36"
    >
      <span>{footer.credit}</span>
      <ArenaLink to={footer.arena.to} className="text-volt hover:text-volt-hover">
        {footer.arena.label} <span aria-hidden="true">{footer.next}</span>
      </ArenaLink>
    </FluidContainer>
  );
}
