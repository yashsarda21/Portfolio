import { ui } from "@/content";
import { Glass, Heading, SelectableList, Text } from "@/design-system";
import type { TrophiesView } from "./view";

/** ON THE PLINTH: one pane per trophy won (all in the HTML, the unselected ones hidden). */
export function PlinthDetail({ view }: { view: TrophiesView }) {
  return (
    <Glass className="flex flex-col px-5.5 py-5 max-md:px-4 max-md:py-4 min-[1200px]:min-h-65.5">
      {view.trophies.map(({ id, detail }) =>
        detail ? (
          <SelectableList.Panel key={id} value={id} className="flex flex-1 flex-col gap-2.5">
            <div className="flex justify-between gap-x-4">
              <Text variant="mono-label" tone="gold" leading="font">
                {view.plinthLabel}
              </Text>
              <Text variant="mono-note" tone="label">
                {detail.index}
              </Text>
            </div>
            <Heading level={2} variant="title-panel">
              {detail.title}
            </Heading>
            <Text variant="mono-chip" tone="label">
              {detail.sub}
            </Text>
            <Text as="p" variant="body-copy" tone="body" leading="recipe">
              {detail.description}
            </Text>
            {detail.links.length > 0 ? (
              <div className="mt-auto flex flex-wrap gap-x-4.5 gap-y-2">
                {detail.links.map((link) => (
                  <Text
                    key={link.href}
                    as="a"
                    href={link.href}
                    variant="mono-nav"
                    tone="volt"
                    className="hover:text-volt-hover"
                  >
                    {link.label} <span aria-hidden="true">{ui.glyph.external}</span>
                  </Text>
                ))}
              </div>
            ) : null}
          </SelectableList.Panel>
        ) : null,
      )}
    </Glass>
  );
}
