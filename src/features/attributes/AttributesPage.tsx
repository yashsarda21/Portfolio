import { content, ui } from "@/content";
import { Legend } from "@/design-system";
import portraitSrc from "@/assets/portrait-rest.webp";
import { ContentPage } from "@/shell/ContentPage";
import { ROUTES } from "@/shell/routes";
import { AttributeGroups } from "./AttributeGroups";
import { PlayerProfile } from "./PlayerProfile";
import { buildAttributesView, type AttributesView } from "./view";

const t = ui.pages.attributes;

/** The attributes page: a pure view of an AttributesView. */
export function AttributesPage({ view }: { view: AttributesView }) {
  return (
    <ContentPage
      route="attributes"
      venue="hall"
      trail={[ui.venues.badminton]}
      eyebrow={t.eyebrow}
      aside={<Legend items={view.legend} />}
      rematch={ROUTES.badminton}
      next={{ label: t.next, to: ROUTES.trophies }}
      comm={t.comm}
    >
      <div className="grid flex-1 gap-4 min-[1200px]:grid-cols-[300px_minmax(0,1fr)] min-[1200px]:gap-6">
        <PlayerProfile profile={view.profile} />
        <AttributeGroups groups={view.groups} />
      </div>
    </ContentPage>
  );
}

// Content is static, so the view is built once.
const view = buildAttributesView(content, ui, portraitSrc);

export function AttributesScreen() {
  return <AttributesPage view={view} />;
}
