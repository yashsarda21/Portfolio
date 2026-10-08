import {
  ArenaBackdrop,
  AudioToggle,
  BrandLockup,
  Button,
  LiveDot,
  ScreenColumn,
  Scoreboard,
  Text,
} from "@/design-system";
import { ArenaLink } from "@/shell/ArenaLink";
import { useAudio } from "@/shell/audio";
import { LANDING_BEATS, bootDelay } from "./beats";
import type { LandingView } from "./view";

/**
 * The Landing below 1200px (Mobile-Landing, centred and one size step up on a tablet). A ScreenColumn, so a
 * short phone scrolls instead of clipping: the board and the calls to action are one group, the challenge line
 * 40px under the board (56px from a tablet), centred under the top row. It plays the desktop's CSS boot on the
 * same beats and pace (LANDING_BEATS, --pace): the scene starts dark, the two banks flicker on left then right,
 * and each part enters at its turn; the top row is there from the first frame. A part that has not appeared yet
 * is `visibility: hidden`, so nothing unseen takes focus. Silent: no commentary, no keyboard hint, no SKIP INTRO.
 */
export function LandingColumn({ view }: { view: LandingView }) {
  const audio = useAudio();
  const beat = LANDING_BEATS;

  return (
    <ScreenColumn
      until="lg"
      data-landing-column
      backdrop={<ArenaBackdrop layout="column" boot={beat} />}
      top={
        <>
          <BrandLockup mark={view.brand.mark} size="sm" />
          <AudioToggle
            variant="text"
            name={view.audio.name}
            label={view.audio.labelPhone}
            stateOn={view.audio.on}
            stateOff={view.audio.off}
            on={audio.enabled}
            onToggle={audio.toggle}
          />
        </>
      }
      actions={
        <div
          data-part="actions"
          className="flex animate-boot-rise flex-col gap-3"
          style={bootDelay(beat.ctas)}
        >
          <Text as="p" variant="challenge" tone="body" leading="font" className="mb-2 text-center">
            {view.challenge}
          </Text>
          <Button
            as={ArenaLink}
            to={view.enter.to}
            size="bar-lg"
            skew={false}
            subLabel={view.enter.subPhone}
            onClick={audio.unlock}
          >
            {view.enter.label}
          </Button>
          <Button
            as={ArenaLink}
            to={view.view.to}
            size="bar-lg"
            skew={false}
            variant="secondary"
            subLabel={view.view.sub}
          >
            {view.view.label}
          </Button>
        </div>
      }
    >
      <div data-part="board">
        <Scoreboard size="compact">
          <Scoreboard.Scan
            variant="band"
            className="animate-boot-scan"
            style={bootDelay(beat.scan)}
          />
          <Scoreboard.Header
            data-part="board-header"
            className="animate-boot-fade"
            style={bootDelay(beat.boardHeader)}
          >
            <span className="flex items-center gap-2">
              <LiveDot size={6} /> <span>{view.header.live}</span>
            </span>
            <span>{view.header.playerShort}</span>
          </Scoreboard.Header>
          <Scoreboard.Body>
            <Scoreboard.Title as="h1" className="animate-boot-name" style={bootDelay(beat.name)}>
              {view.title.name}
            </Scoreboard.Title>
            <Scoreboard.Subtitle
              className="animate-boot-name [--boot-from:0.7em]"
              style={bootDelay(beat.title)}
            >
              {view.title.role}
            </Scoreboard.Subtitle>
          </Scoreboard.Body>
          <Scoreboard.Footer
            data-part="board-footer"
            className="animate-boot-fade"
            style={bootDelay(beat.boardFooter)}
          >
            <Scoreboard.FooterCells cells={view.footerPhone} />
          </Scoreboard.Footer>
        </Scoreboard>
      </div>
    </ScreenColumn>
  );
}
