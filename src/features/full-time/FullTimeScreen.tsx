import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { ui } from "@/content";
import { MEDIA } from "@/lib/breakpoints";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useCommentary } from "@/shell/commentary";
import { useMatchRecord, useRecordReady } from "@/shell/matchRecord";
import { ROUTES } from "@/shell/routes";
import { FullTimePage } from "./FullTimePage";
import { buildFullTimeView } from "./view";

/** The route's screen: reads how far the matchday got and how close it came, says the line for it (the stage only). */
export function FullTimeScreen() {
  const record = useMatchRecord(
    useShallow((s) => ({ venuesPlayed: s.venuesPlayed, bestForm: s.bestForm })),
  );
  const ready = useRecordReady();
  const { say } = useCommentary();
  const desktop = useMediaQuery(MEDIA.lg);
  const view = useMemo(() => buildFullTimeView(ui, ROUTES, record), [record]);

  // Once the record is in: the line for it, and again only when it changes. Only the stage speaks (L11).
  useEffect(() => {
    if (ready && desktop) say(view.comm, { interrupt: true });
  }, [ready, desktop, view.comm, say]);

  return <FullTimePage view={view} ready={ready} />;
}
