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
import type { LandingView } from "./view";

/**
 * The Landing below 1200px (Mobile-Landing, centred and one size step up on a tablet). A ScreenColumn, so a
 * short phone scrolls instead of clipping: the board sits 130px down, the calls to action 40px above the end.
 * Static, as drawn (no boot), and silent: no commentary, no keyboard hint, no SKIP INTRO.
 */
export function LandingColumn({ view }: { view: LandingView }) {
  const audio = useAudio();

  return (
    <ScreenColumn
      until="lg"
      data-landing-column
      backdrop={<ArenaBackdrop layout="column" />}
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
        <>
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
        </>
      }
    >
      {/* From a tablet up the board and the calls to action sit together, centred in what the top row leaves. */}
      <div data-part="board" className="mt-17.5 md:mt-0">
        <Scoreboard size="compact">
          <Scoreboard.Header>
            <span className="flex items-center gap-2">
              <LiveDot size={6} /> <span>{view.header.live}</span>
            </span>
            <span>{view.header.playerShort}</span>
          </Scoreboard.Header>
          <Scoreboard.Body>
            <Scoreboard.Title as="h1">{view.title.name}</Scoreboard.Title>
            <Scoreboard.Subtitle>{view.title.role}</Scoreboard.Subtitle>
          </Scoreboard.Body>
          <Scoreboard.Footer>
            <Scoreboard.FooterCells cells={view.footerPhone} />
          </Scoreboard.Footer>
        </Scoreboard>
      </div>
    </ScreenColumn>
  );
}
