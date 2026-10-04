import { useState } from "react";
import { content, ui } from "@/content";
import { SelectableList, Text } from "@/design-system";
import { ContentPage } from "@/shell/ContentPage";
import { useCommentary } from "@/shell/commentary";
import { ROUTES } from "@/shell/routes";
import { Draw } from "./Draw";
import { Replay } from "./Replay";
import { ShotData } from "./ShotData";
import { buildHighlightsView, type HighlightsView } from "./view";

const NEXT_VENUE = `${ui.hud.nextVenue} ${ui.glyph.sep} ${ui.venues.badminton}`;

/**
 * Draw, replay and shot data on the artboard's 302 | 720 | 302 grid (the shot data's 2px margin makes the
 * gap before it the drawn 24px). From 768 the draw and replay sit side by side with the shot data below;
 * under 768 everything stacks.
 */
const PANELS =
  "grid flex-1 gap-5.5 md:max-[1199px]:grid-cols-[17rem_minmax(0,1fr)] min-[1200px]:grid-cols-[302fr_720fr_302fr]";

/** The highlights page: a pure view of a HighlightsView. */
export function HighlightsPage({ view }: { view: HighlightsView }) {
  const [selected, setSelected] = useState(view.defaultId);
  const { say } = useCommentary();

  const pick = (id: string) => {
    setSelected(id);
    const item = view.items.find((i) => i.id === id);
    // A pick is the visitor's own action: it answers at once, cutting off the line on air.
    if (item) say(item.comm, { interrupt: true });
  };

  const first = view.items.find((i) => i.id === view.defaultId) ?? view.items[0]!;

  return (
    <ContentPage
      route="highlights"
      venue="court"
      trail={[ui.venues.tennis]}
      eyebrow={ui.pages.highlights.eyebrow}
      aside={
        <Text variant="mono-md" tone="label" className="leading-auto">
          {view.unlocked}
        </Text>
      }
      rematch={ROUTES.tennis}
      next={{ label: NEXT_VENUE, to: ROUTES.badminton }}
      comm={first.comm}
    >
      <SelectableList.Root value={selected} onValueChange={pick} className={PANELS}>
        <Draw view={view} />
        {view.items.map((item) => (
          // The panel has no box of its own: its replay and shot data are cells of the grid.
          <SelectableList.Panel key={item.id} value={item.id} className="contents">
            <Replay item={item} />
            <ShotData
              item={item}
              label={view.shotDataLabel}
              className="min-[1200px]:ml-0.5 md:max-[1199px]:col-span-2"
            />
          </SelectableList.Panel>
        ))}
      </SelectableList.Root>
    </ContentPage>
  );
}

// Content is static, so the view is built once.
const view = buildHighlightsView(content, ui);

export function HighlightsScreen() {
  return <HighlightsPage view={view} />;
}
