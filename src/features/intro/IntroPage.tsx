import { useMemo, type Ref } from "react";
import { ArenaBackdrop, BrandLockup, HUD, LiveDot, Scoreboard, Stage } from "@/design-system";
import { CommentarySlot } from "@/shell/commentary";
import { IntroColumn } from "./IntroColumn";
import { IntroFigure } from "./IntroFigure";
import {
  IntroControls,
  IntroEnter,
  IntroName,
  IntroTagline,
  IntroTitle,
  IntroWelcome,
} from "./IntroParts";
import { createLetters } from "./letters";
import type { IntroView } from "./view";

/**
 * The Player Introduction. From 768px up (desktop and tablet, L1) the 1440x900 stage plays the intro: a
 * timeline (useIntroTimeline) lights the scene, swings the silhouette in, locks the name in and finishes with
 * the call to action. Below 768px the phone's column plays its own two-second cut (IntroColumn, L6). Each
 * layout is marked `data-intro-layout`, so the timeline collects the parts of the one on show only.
 *
 * `data-hold` on the root says where the show is (pending, playing, done). While it is pending, every part the
 * timeline reveals carries `hold-part` and is hidden by CSS, scenery included, so nothing shows lit before
 * the first frame. Everything is addressed by `data-part`; the page holds no timing and no copy.
 */
export function IntroPage({
  view,
  rootRef,
  onReplay,
}: {
  view: IntroView;
  rootRef?: Ref<HTMLElement>;
  /** Plays the show again. Leave it out until there is a show to replay: REPLAY is then disabled. */
  onReplay?: () => void;
}) {
  const letters = useMemo(() => createLetters(view.name), [view.name]);

  return (
    <main id="main" ref={rootRef} data-hold="pending">
      {/* No box of its own: it only names the stage's parts, so the hook never reaches into the phone column. */}
      <div data-intro-layout="stage" className="contents">
        <Stage
          from="md"
          backdrop={<ArenaBackdrop layout="intro" bleed dust layerClassName="hold-part" />}
          skyClassName="hold-part"
        >
          <HUD
            className="absolute inset-x-0 top-0 z-9"
            left={<BrandLockup mark={view.brand.mark} />}
            right={<IntroControls view={view} onReplay={onReplay} />}
          />

          {/* h-135.5 w-310.5: the board is 1240x540 inside its 1px border (the artboard sizes the content box), so 1242x542 outside. */}
          <Scoreboard.Power className="top-24 left-25 h-135.5 w-310.5" />
          <Scoreboard size="intro" className="absolute top-24 left-25 h-135.5 w-310.5">
            <Scoreboard.Header data-part="board-header" className="hold-part">
              <span className="flex items-center gap-2.5">
                <LiveDot />
                {view.header.live}
              </span>
              <span>{view.header.matchday}</span>
            </Scoreboard.Header>

            {/* The warm glow the silhouette is cut against. */}
            <div
              aria-hidden="true"
              data-part="backlight"
              className="pointer-events-none hold-part absolute -right-10 bottom-7.5 h-130 w-175 intro-backlight"
            />
            <Scoreboard.Scan variant="bar" />

            <IntroFigure alt={view.portraitAlt} />

            <div className="absolute top-37.5 left-14 z-4 flex flex-col gap-4.5">
              <IntroName heading={view.heading} letters={letters} />
              <IntroTitle title={view.title} className="h-9.5" />
              <IntroTagline parts={view.tagline} variant="stage" />
            </div>

            <Scoreboard.Footer data-part="board-strip" className="hold-part">
              <Scoreboard.FooterCells cells={view.footer} />
            </Scoreboard.Footer>
          </Scoreboard>

          <div
            aria-hidden="true"
            data-part="flash"
            className="pointer-events-none invisible absolute inset-0 z-6 intro-flash"
          />

          <div className="absolute inset-x-0 top-167 z-7 flex flex-col items-center gap-5.5">
            <IntroWelcome text={view.welcome} />
            <IntroEnter enter={view.enter} variant="stage" />
          </div>

          {/* The line mounts at its beat (IntroScreen says it then) and enters with its own animation. */}
          <CommentarySlot tag={view.commTag} className="absolute bottom-9 left-9 z-7" />
        </Stage>
      </div>

      <IntroColumn view={view} letters={letters} onReplay={onReplay} />
    </main>
  );
}
