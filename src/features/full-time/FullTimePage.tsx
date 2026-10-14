import { FullTimeColumn } from "./FullTimeColumn";
import { FullTimeStage } from "./FullTimeStage";
import type { FullTimeView } from "./view";

/**
 * Full Time, as the saved match record reads: one `main` holding both layouts (CSS shows exactly one: the stage from
 * 1200px, the column below), so a resize keeps the page. Each has its own `h1` (the verdict); the hidden one is not
 * rendered, so there is one. `ready` is false until the saved record has loaded: the parts that depend on it wait
 * (H5), and the prerender is the "NOT YET." state.
 */
export function FullTimePage({ view, ready = true }: { view: FullTimeView; ready?: boolean }) {
  return (
    <main id="main" data-full-time="" data-state={view.state}>
      <FullTimeStage view={view} ready={ready} />
      <FullTimeColumn view={view} ready={ready} />
    </main>
  );
}
