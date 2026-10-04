import { BallByBall, ChipList, Glass, Heading, SelectableList, Text } from "@/design-system";
import { ui } from "@/content";
import { ArenaLink } from "@/shell/ArenaLink";
import type { CareerView, DetailFooter } from "./view";

/** What closes a panel: the stack for an innings, the way on to the Trophy Room for the academy. */
function Footer({ footer }: { footer: DetailFooter }) {
  if (footer.kind === "shots") {
    return (
      <ChipList
        items={footer.stack}
        size="md"
        text="name"
        heading={footer.label}
        className="mt-auto"
      />
    );
  }
  return (
    <div className="mt-auto">
      <Text
        as={ArenaLink}
        to={footer.to}
        variant="mono-md"
        tone="volt"
        leading="font"
        className="hover:text-volt-hover"
      >
        {footer.label} <span aria-hidden="true">{ui.glyph.next}</span>
      </Text>
    </div>
  );
}

/** The right-hand panel: one pane per row (all in the HTML, the unselected ones hidden). */
export function InningsDetail({ rows }: { rows: CareerView["rows"] }) {
  return (
    <Glass className="flex flex-col px-6 py-5.5 max-md:px-4 max-md:py-4">
      {rows.map(({ id, detail }) => (
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
              {detail.title}
            </Heading>
            <Text variant="body" tone="secondary" leading="font">
              {detail.roleLine}
            </Text>
          </div>
          <BallByBall items={detail.balls} />
          <Footer footer={detail.footer} />
        </SelectableList.Panel>
      ))}
    </Glass>
  );
}
