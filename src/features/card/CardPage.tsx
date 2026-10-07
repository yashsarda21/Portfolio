import { Fragment, useState, useSyncExternalStore } from "react";
import { content, ui } from "@/content";
import { PlayerCard, ShowcaseBackdrop, Text } from "@/design-system";
import portraitSrc from "@/assets/portrait-rest.webp";
import { useCopyText } from "@/lib/useCopyText";
import { BUILD_YEAR } from "@/shell/config";
import { ContentPage } from "@/shell/ContentPage";
import { ROUTES } from "@/shell/routes";
import { CardBack, CardFront } from "./CardFaces";
import { Profile } from "./Profile";
import { TakeAway } from "./TakeAway";
import { buildCardView, type CardView } from "./view";

const t = ui.pages.card;

const subscribe = () => () => {};

/**
 * The season on the card. The page is prerendered, so the HTML carries the year of the build (the server
 * snapshot); once React has taken over, the visitor's own year replaces it. `live: false` pins the build year.
 */
function useSeasonYear(buildYear: number, live: boolean) {
  return useSyncExternalStore(
    subscribe,
    () => (live ? new Date().getFullYear() : buildYear),
    () => buildYear,
  );
}

/**
 * The player card page: a pure view of a CardView. The card flips (button, Enter or Space), tilts toward a mouse
 * and floats; the actions beside it take the resume away, and the way on is TEAM UP.
 */
export function CardPage({ view, liveYear = true }: { view: CardView; liveYear?: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const link = useCopyText();
  const year = useSeasonYear(view.front.season.buildYear, liveYear);

  return (
    <ContentPage
      route="card"
      trail={[]}
      eyebrow={t.eyebrow}
      title={view.titleLines.map((line, i) => (
        <Fragment key={line}>
          {i > 0 ? (
            <>
              {" "}
              <br />
            </>
          ) : null}
          {line}
        </Fragment>
      ))}
      backdrop={<ShowcaseBackdrop />}
      next={{ label: t.next, to: ROUTES.teamUp }}
      comm={t.comm}
      columns={{
        kind: "showcase",
        stage: (
          <PlayerCard
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
            label={flipped ? view.flip.toFront : view.flip.toBack}
            front={<CardFront view={view.front} year={year} />}
            back={<CardBack view={view.back} />}
          />
        ),
        caption: (
          <Text as="p" variant="mono-round" tone="dim" leading="font" className="text-center">
            <span className="pointer-coarse:hidden">{view.hint.pointer}</span>
            <span className="hidden pointer-coarse:inline">{view.hint.touch}</span>
          </Text>
        ),
        rail: <TakeAway take={view.take} note={view.backNote} link={link} />,
      }}
    >
      <Profile view={view} />
    </ContentPage>
  );
}

// Content is static, so the view is built once. The year is the build's; the card updates it on the client.
// During prerender there is no window, so the scouting link is a relative path there.
const view = buildCardView(content, ui, ROUTES, {
  portraitSrc,
  origin: typeof window === "undefined" ? "" : window.location.origin,
  buildYear: BUILD_YEAR,
});

export function CardScreen() {
  return <CardPage view={view} />;
}
