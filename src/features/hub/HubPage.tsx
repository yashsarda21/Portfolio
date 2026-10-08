import { ArenaTabBar } from "@/shell/ArenaTabBar";
import { HubColumn } from "./HubColumn";
import { HubStage } from "./HubStage";
import type { HubView } from "./view";

/**
 * The Hub, as the saved match record reads. From 1200px the stage; below it the fixtures column, with the phone's tab
 * bar after the page (the one landmark, like the content pages).
 * `ready` is false until the saved record has loaded: the parts that depend on it wait (H5).
 */
export function HubPage({ view, ready = true }: { view: HubView; ready?: boolean }) {
  return (
    <>
      <main id="main">
        <HubStage view={view} ready={ready} />
        <HubColumn view={view} ready={ready} />
      </main>
      <ArenaTabBar />
    </>
  );
}
