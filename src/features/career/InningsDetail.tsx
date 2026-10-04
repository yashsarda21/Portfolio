import { BallByBall, ChipList, Glass, Heading, SelectableList, Text } from "@/design-system";
import type { CareerView } from "./view";

/** The right-hand panel: one pane per innings (all in the HTML, the unselected ones hidden). */
export function InningsDetail({ rows }: { rows: CareerView["rows"] }) {
  return (
    <Glass className="flex flex-col px-6 py-5.5 max-md:px-4 max-md:py-4">
      {rows.map(({ id, team, detail }) => (
        <SelectableList.Panel key={id} value={id} className="flex flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <Text variant="mono-label" tone="volt" leading="font">
              {detail.heading}
            </Text>
            <Text variant="mono-xs" tone="label" leading="font">
              {detail.span}
            </Text>
          </div>
          <div className="flex flex-col gap-0.5">
            <Heading level={2} variant="title-detail">
              {team}
            </Heading>
            <Text variant="body" tone="secondary" leading="font">
              {detail.roleLine}
            </Text>
          </div>
          <BallByBall items={detail.balls} />
          <ChipList
            items={detail.stack}
            size="md"
            text="name"
            heading={detail.shotsLabel}
            className="mt-auto"
          />
        </SelectableList.Panel>
      ))}
    </Glass>
  );
}
