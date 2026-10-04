import { useState } from "react";
import { content, ui } from "@/content";
import { SelectableList, StatTile } from "@/design-system";
import { ContentPage } from "@/shell/ContentPage";
import { ROUTES } from "@/shell/routes";
import { InningsDetail } from "./InningsDetail";
import { Scorecard } from "./Scorecard";
import { buildCareerView, type CareerView } from "./view";

/** The tiles tick in one after another (0, .1s, .2s). Literal classes so Tailwind generates them. */
const TICK = ["animate-rise", "animate-rise [--d:0.1s]", "animate-rise [--d:0.2s]"] as const;

const NEXT_VENUE = `${ui.hud.nextVenue} ${ui.glyph.sep} ${ui.venues.tennis}`;

/** The career scorecard page: a pure view of a CareerView. */
export function CareerPage({ view }: { view: CareerView }) {
  const [selected, setSelected] = useState(view.defaultId);
  return (
    <ContentPage
      route="career"
      venue="turf"
      trail={[ui.venues.cricket]}
      eyebrow={ui.pages.career.eyebrow}
      aside={view.stats.map((stat, i) => (
        <StatTile
          key={stat.label}
          label={stat.label}
          value={stat.value}
          tone={stat.tone}
          className={TICK[i % TICK.length]}
        />
      ))}
      rematch={ROUTES.cricket}
      next={{ label: NEXT_VENUE, to: ROUTES.tennis }}
      comm={content.commentary.reveal[1]}
    >
      <SelectableList.Root
        value={selected}
        onValueChange={setSelected}
        className="grid flex-1 gap-5.5 min-[1200px]:grid-cols-[401fr_272fr]"
      >
        <Scorecard view={view} />
        <InningsDetail rows={view.rows} />
      </SelectableList.Root>
    </ContentPage>
  );
}

// Content is static, so the view is built once.
const view = buildCareerView(content, ui, ROUTES);

export function CareerScreen() {
  return <CareerPage view={view} />;
}
