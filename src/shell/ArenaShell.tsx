import { useEffect, type ReactNode } from "react";
import { AudioProvider } from "./audio";
import { CommentaryProvider } from "./commentary";
import { MatchRecordHydrator } from "./matchRecord";
import { RouteAnnouncer } from "./RouteAnnouncer";
import { SeenTracker } from "./sections";
import { TransitionProvider } from "./transition";

/**
 * Site-wide services around every page (spec §4.6). Once React has taken over the prerendered page it sets
 * `data-hydrated` on <html>, so a test (or a script) can wait for the page to be interactive.
 */
export function ArenaShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.hydrated = "";
    return () => {
      delete root.dataset.hydrated;
    };
  }, []);
  return (
    <AudioProvider>
      <CommentaryProvider>
        <TransitionProvider>
          <MatchRecordHydrator />
          <SeenTracker />
          <RouteAnnouncer />
          {children}
        </TransitionProvider>
      </CommentaryProvider>
    </AudioProvider>
  );
}
