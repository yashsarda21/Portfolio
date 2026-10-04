import { ArenaLink } from "@/shell/ArenaLink";
import type { ScoutReport } from "./report";

export function ScoutFooter({ footer }: { footer: ScoutReport["footer"] }) {
  return (
    <footer className="relative mx-auto flex max-w-312 flex-wrap justify-between gap-3 px-6 pb-12 type-mono-nav text-dim max-md:px-4 max-md:pb-36">
      <span>{footer.credit}</span>
      <ArenaLink to={footer.arena.to} className="text-volt hover:text-volt-hover">
        {footer.arena.label} <span aria-hidden="true">{footer.next}</span>
      </ArenaLink>
    </footer>
  );
}
