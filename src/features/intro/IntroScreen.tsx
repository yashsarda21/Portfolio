import { useCallback, useRef } from "react";
import { content, ui } from "@/content";
import { useCommentary } from "@/shell/commentary";
import { ROUTES } from "@/shell/routes";
import { IntroPage } from "./IntroPage";
import { useIntroTimeline } from "./useIntroTimeline";
import { buildIntroView } from "./view";

const view = buildIntroView(content, ui, ROUTES);

/** The route's screen: plays the introduction, says its line at the commentary beat, and wires REPLAY. */
export function IntroScreen() {
  const { say } = useCommentary();
  const rootRef = useRef<HTMLElement>(null);
  const onComm = useCallback(() => say(view.comm, { interrupt: true }), [say]);
  const { replay, canReplay } = useIntroTimeline(rootRef, { onComm });

  return <IntroPage view={view} rootRef={rootRef} onReplay={canReplay ? replay : undefined} />;
}
