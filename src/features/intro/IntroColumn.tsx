import { ArenaBackdrop, BrandLockup, LiveDot, ScreenColumn, Scoreboard } from "@/design-system";
import portraitRest from "@/assets/portrait-rest.webp?url";
import type { IntroLetter } from "./letters";
import {
  IntroControls,
  IntroEnter,
  IntroName,
  IntroTagline,
  IntroTitle,
  IntroWelcome,
} from "./IntroParts";
import type { IntroView } from "./view";

/** The rest portrait's own size, so the browser holds its place before it has loaded. */
const PORTRAIT = { width: 700, height: 564 } as const;

/**
 * The Player Introduction below 768px (L6): the phone's two-second cut, derived from the Mobile-Landing frame
 * since no board exists for it. A ScreenColumn, so a short phone scrolls instead of clipping. The rest portrait
 * fades in above the stacked name (no mover, no head turn, so no strips are ever requested); the page is
 * silent (L11): no commentary, no dust. `data-part` names are the stage's, so one timeline factory serves both.
 */
export function IntroColumn({
  view,
  letters,
  onReplay,
}: {
  view: IntroView;
  letters: IntroLetter[];
  onReplay?: () => void;
}) {
  return (
    <ScreenColumn
      until="md"
      data-intro-layout="column"
      backdrop={<ArenaBackdrop layout="column" layerClassName="hold-part" />}
      top={
        <>
          <BrandLockup mark={view.brand.mark} size="sm" />
          <div className="flex items-center gap-2">
            <IntroControls view={view} onReplay={onReplay} tone="glass-compact" />
          </div>
        </>
      }
      actions={
        <>
          <IntroWelcome text={view.welcome} className="text-center" />
          <IntroEnter enter={view.enter} variant="column" />
        </>
      }
    >
      <div className="mt-6">
        <Scoreboard size="compact">
          {/* The 360px phone has no room for the counter beside the longer label. */}
          <Scoreboard.Header data-part="board-header" className="hold-part" hideEndBelow="xs">
            <span className="flex items-center gap-2 whitespace-nowrap">
              <LiveDot size={6} /> <span>{view.header.live}</span>
            </span>
            <span>{view.header.count}</span>
          </Scoreboard.Header>
          <Scoreboard.Body>
            <img
              data-part="portrait"
              src={portraitRest}
              alt=""
              width={PORTRAIT.width}
              height={PORTRAIT.height}
              decoding="async"
              className="hold-part h-auto w-3/4 portrait-fade"
            />
            <IntroName heading={view.heading} letters={letters} stacked />
            <IntroTitle title={view.title} />
            <IntroTagline parts={view.tagline} variant="column" />
          </Scoreboard.Body>
          <Scoreboard.Footer data-part="board-strip" className="hold-part">
            <Scoreboard.FooterCells cells={view.footerPhone} />
          </Scoreboard.Footer>
        </Scoreboard>
      </div>
    </ScreenColumn>
  );
}
