import {
  AudioToggle,
  BrandLockup,
  Button,
  CrowdTier,
  FloodlightBank,
  LiveDot,
  Scoreboard,
  SkyGlow,
  Text,
  VenueGlow,
} from "@/design-system";
import { ArenaLink } from "@/shell/ArenaLink";
import { useAudio } from "@/shell/audio";
import type { LandingView } from "./view";

/**
 * The Landing below 1200px (Mobile-Landing, centred and one size step up on a tablet). A flex column, so a
 * short phone scrolls instead of clipping: the board sits 130px down, the calls to action 40px above the end.
 * Static, as drawn (no boot), and silent: no commentary, no keyboard hint, no SKIP INTRO.
 */
export function LandingColumn({ view }: { view: LandingView }) {
  const audio = useAudio();

  return (
    <div
      data-landing-column
      data-venue="turf"
      className="relative flex min-h-dvh flex-col bg-night lg:hidden"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <SkyGlow w="90%" h="40%" alpha={0.2} />
        <VenueGlow y="100%" w="120%" h="30%" alpha={0.35} />
        {/* The banks hang over the column's own edges (the phone's 390px is the column), not the window's. */}
        <div className="relative mx-auto h-full max-w-160">
          <FloodlightBank data-part="bank-left" size="mobile" className="top-14 left-7.5" />
          <FloodlightBank data-part="bank-right" size="mobile" className="top-14 right-7.5" />
        </div>
        <CrowdTier flat alpha={0.22} className="-inset-x-5 top-105 h-40 opacity-100" />
      </div>
      <div className="relative mx-auto flex w-full max-w-160 flex-1 flex-col px-4 pt-4 pb-10">
        <div className="flex items-center justify-between">
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
        </div>
        {/* From a tablet up the board and the calls to action sit together, centred in what the top row leaves. */}
        <div className="flex flex-1 flex-col md:justify-center md:py-8">
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
                {view.footerPhone.map((cell) => (
                  <Scoreboard.FooterCell
                    key={cell.label}
                    label={cell.label}
                    value={cell.value}
                    tone={cell.tone}
                    align={cell.align}
                  />
                ))}
              </Scoreboard.Footer>
            </Scoreboard>
          </div>
          <div className="mt-auto flex flex-col gap-3 pt-6 md:mt-14 md:pt-0">
            <Text
              as="p"
              variant="challenge"
              tone="body"
              leading="font"
              className="mb-2 text-center"
            >
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
        </div>
      </div>
    </div>
  );
}
