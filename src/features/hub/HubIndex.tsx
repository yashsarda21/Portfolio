import { IndexRail, ProgressSteps, RailSection, RecordChip, Text } from "@/design-system";
import { ArenaLink } from "@/shell/ArenaLink";
import type { HubView } from "./view";

interface HubIndexProps {
  view: HubView;
  /** In the drawer the record chip is not in the top row, so it leads the list. */
  inDrawer?: boolean;
  /** Called when a link is chosen (the drawer closes). */
  onNavigate?: () => void;
}

/** The Hub's rail content: the matchday card, the full index, the hidden achievements. Shared by the stage rail and the drawer. */
export function HubIndex({ view, inDrawer = false, onNavigate }: HubIndexProps) {
  const { matchday, index, achievements, record } = view;
  return (
    <IndexRail
      label={index.label}
      title={index.title}
      links={index.links.map((link) => ({ ...link, as: ArenaLink, onClick: onNavigate }))}
      className="h-full"
      header={
        <>
          {inDrawer ? <RecordChip label={record.label} value={record.value} /> : null}
          <RailSection label={matchday.label}>
            <Text variant="title-matchday" tone="primary">
              {matchday.title}
            </Text>
            <ProgressSteps
              total={matchday.total}
              done={matchday.done}
              label={matchday.progress}
              animate
              className="mt-1"
            />
          </RailSection>
        </>
      }
      footer={
        <RailSection label={achievements.label}>
          <Text as="p" variant="body-sm" tone="secondary" leading="font">
            {achievements.text}
          </Text>
        </RailSection>
      }
    />
  );
}
