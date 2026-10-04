import { Heading, MediaSlot, ProblemApproachResult, Text } from "@/design-system";
import type { HighlightItemView } from "./view";

/** The middle column: the screen recording (or its placeholder), the title and line, then problem / approach / result. */
export function Replay({ item }: { item: HighlightItemView }) {
  const { media, par } = item;
  const lineId = `${item.id}-line`;
  const parId = `${item.id}-par`;
  return (
    <div className="flex min-w-0 flex-col gap-4.5">
      <MediaSlot
        label={media.label}
        badge={media.badge}
        round={media.round}
        media={media.video}
        // A recording has no captions of its own (it is silent), so the text next to it is its text alternative.
        describedBy={`${lineId} ${parId}`}
      />
      <div className="flex flex-col gap-1.5">
        <Heading level={2} variant="title-reel">
          {item.name}
        </Heading>
        <Text id={lineId} variant="body-deck" tone="secondary">
          {item.line}
        </Text>
      </div>
      <ProblemApproachResult id={parId} serve={par.serve} rally={par.rally} winner={par.winner} />
    </div>
  );
}
