import { HubStage } from "./HubStage";
import type { HubView } from "./view";

/**
 * The Hub, as the saved match record reads. From 1200px the stage; below it the fixtures column (Task 6).
 * `ready` is false until the saved record has loaded: the parts that depend on it wait (H5).
 */
export function HubPage({ view, ready = true }: { view: HubView; ready?: boolean }) {
  return (
    <main id="main">
      <HubStage view={view} ready={ready} />
    </main>
  );
}
