import type { ReactNode } from "react";
import { AudioProvider } from "./audio";
import { CommentaryProvider } from "./commentary";
import { MatchRecordHydrator } from "./matchRecord";
import { RouteAnnouncer } from "./RouteAnnouncer";
import { TransitionProvider } from "./transition";

/** Site-wide services around every page (spec §4.6). */
export function ArenaShell({ children }: { children: ReactNode }) {
  return (
    <AudioProvider>
      <CommentaryProvider>
        <TransitionProvider>
          <MatchRecordHydrator />
          <RouteAnnouncer />
          {children}
        </TransitionProvider>
      </CommentaryProvider>
    </AudioProvider>
  );
}
