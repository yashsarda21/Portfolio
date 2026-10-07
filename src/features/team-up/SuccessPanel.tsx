import { useEffect, useId, useRef } from "react";
import { Button, CommentaryBar, Heading, Scoreboard, Text } from "@/design-system";
import { ui } from "@/content";
import type { TeamUpView } from "./view";

/**
 * What replaces the form once a challenge is in: the heading (focused, so the page's new state is read first),
 * the commentary line, the fixture on the scoreboard, and a way to send another. The commentary bar is a
 * picture of the line; the page's status region is what announces it.
 */
export function SuccessPanel({ view, onAgain }: { view: TeamUpView; onAgain: () => void }) {
  const headingId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const { board } = view.success;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5.5">
      <Heading ref={heading} id={headingId} level={2} variant="d2" tone="volt" tabIndex={-1}>
        {view.success.title}
      </Heading>
      <CommentaryBar
        aria-hidden="true"
        variant="inline"
        tag={ui.comm.tag}
        line={view.success.comm}
        className="self-start"
      />
      <Scoreboard>
        <Scoreboard.Header>
          <span>{board.fixture}</span>
        </Scoreboard.Header>
        <Scoreboard.Body className="flex-row gap-6 py-8">
          <Text variant="d2s" tone="led" className="glow-led">
            {board.visitor}
          </Text>
          <Text variant="mono-lg" tone="volt">
            {board.versus}
          </Text>
          <Text variant="d2s" tone="led" className="glow-led">
            {board.home}
          </Text>
        </Scoreboard.Body>
      </Scoreboard>
      <Button type="button" variant="outline" size="m" onClick={onAgain} className="self-start">
        {view.success.again}
      </Button>
    </section>
  );
}
