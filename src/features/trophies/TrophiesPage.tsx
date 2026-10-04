import { useState } from "react";
import { content, ui } from "@/content";
import { AcademyCard, SelectableList } from "@/design-system";
import { ContentPage } from "@/shell/ContentPage";
import { ROUTES } from "@/shell/routes";
import { Cabinet } from "./Cabinet";
import { PlinthDetail } from "./PlinthDetail";
import { buildTrophiesView, type TrophiesView } from "./view";

const t = ui.pages.trophies;

/**
 * The Trophy Room page: a pure view of a TrophiesView. The way on to the player card is on by default
 * (spec 11.3); the artboard-copy story turns it off, as the artboard is drawn without it.
 */
export function TrophiesPage({
  view,
  withNext = true,
}: {
  view: TrophiesView;
  withNext?: boolean;
}) {
  const [selected, setSelected] = useState(view.defaultId);
  const { academy } = view;
  return (
    <ContentPage
      route="trophies"
      zone="trophy"
      trail={[]}
      eyebrow={t.eyebrow}
      eyebrowTone="gold"
      backdrop={null}
      next={withNext ? { label: t.next, to: ROUTES.card } : undefined}
    >
      <SelectableList.Root
        value={selected}
        onValueChange={setSelected}
        orientation="horizontal"
        className="grid flex-1 gap-4 min-[1200px]:grid-cols-[872fr_474fr] min-[1200px]:gap-5.5"
      >
        <Cabinet view={view} selected={selected} />
        <div className="flex flex-col gap-4 md:max-[1199px]:grid md:max-[1199px]:grid-cols-2">
          <PlinthDetail view={view} />
          <AcademyCard
            id={academy.id}
            eyebrow={academy.eyebrow}
            aside={academy.aside}
            title={academy.title}
            monogram={academy.monogram}
            name={academy.name}
            degree={academy.degree}
            meta={academy.meta}
            extrasLabel={academy.extrasLabel}
            extras={academy.extraItems}
            className="flex-1"
          />
        </div>
      </SelectableList.Root>
    </ContentPage>
  );
}

// Content is static, so the view is built once.
const view = buildTrophiesView(content, ui, ROUTES);

export function TrophiesScreen() {
  return <TrophiesPage view={view} />;
}
