import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { content, ui } from "@/content";
import { MEDIA } from "@/lib/breakpoints";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useCommentary } from "@/shell/commentary";
import { useMatchRecord, useRecordReady } from "@/shell/matchRecord";
import { ROUTES } from "@/shell/routes";
import { useArenaTransition } from "@/shell/transition";
import { useScreenShortcuts } from "@/shell/useScreenShortcuts";
import { HubPage } from "./HubPage";
import { buildHubView } from "./view";

/** The route's screen: reads the saved record, says the line for it, wires 1 / 2 / 3 to the venues. */
export function HubScreen() {
  const record = useMatchRecord(
    useShallow((s) => ({
      venuesPlayed: s.venuesPlayed,
      lastScores: s.lastScores,
      sectionsSeen: s.sectionsSeen,
      record: s.record,
      achievements: s.achievements,
      lockerRoomUnlocked: s.lockerRoomUnlocked,
    })),
  );
  const ready = useRecordReady();
  const { say } = useCommentary();
  const { go } = useArenaTransition();
  const desktop = useMediaQuery(MEDIA.lg);
  const view = useMemo(() => buildHubView(content, ui, ROUTES, record), [record]);

  // Once the record is in: the line for it, and again only when it changes (a win). Only the stage speaks (L11).
  useEffect(() => {
    if (ready && desktop) say(view.comm, { interrupt: true });
  }, [ready, desktop, view.comm, say]);

  const shortcuts = useMemo(
    () =>
      Object.fromEntries(
        view.venues.map((venue) => [venue.shortcut, () => void go(venue.play.to, "tunnel")]),
      ),
    [view.venues, go],
  );
  useScreenShortcuts(shortcuts, { enabled: desktop });

  return <HubPage view={view} ready={ready} />;
}
