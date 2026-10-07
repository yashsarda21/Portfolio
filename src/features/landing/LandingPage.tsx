import {
  ArenaBackdrop,
  AudioToggle,
  BrandLockup,
  Button,
  HUD,
  HUDButton,
  KeyboardHint,
  LiveDot,
  Scoreboard,
  Stage,
  Text,
} from "@/design-system";
import { ArenaLink } from "@/shell/ArenaLink";
import { useAudio } from "@/shell/audio";
import { CommentarySlot } from "@/shell/commentary";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { LANDING_BEATS, bootDelay } from "./beats";
import type { LandingView } from "./view";

/**
 * The Landing. From 1200px the stage plays Main's floodlight boot in CSS (L3): every part carries its beat as
 * `--d`, and a part that has not appeared yet is `visibility: hidden`, so nothing unseen takes focus. The
 * scenery's own beats live in ArenaBackdrop (boot). The HUD is there from the first frame.
 */
export function LandingPage({ view }: { view: LandingView }) {
  const audio = useAudio();
  const beat = LANDING_BEATS;

  // One <main>; the stage (its title is the h1) and the phone/tablet column are mutually exclusive by breakpoint.
  return (
    <main id="main">
      <Stage from="lg" backdrop={<ArenaBackdrop bleed boot />}>
        <HUD
          className="absolute inset-x-0 top-0"
          left={<BrandLockup mark={view.brand.mark} label={view.brand.label} />}
          right={
            <>
              <AudioToggle
                name={view.audio.name}
                label={view.audio.label}
                stateOn={view.audio.on}
                stateOff={view.audio.off}
                on={audio.enabled}
                onToggle={audio.toggle}
              />
              <HUDButton as={ArenaLink} to={view.skip.to}>
                {view.skip.label}
              </HUDButton>
            </>
          }
        />
        <Scoreboard className="absolute top-35 left-67.5 h-93.5 w-225.5">
          <Scoreboard.Scan
            variant="band"
            className="animate-boot-scan"
            style={bootDelay(beat.scan)}
          />
          <Scoreboard.Header className="animate-boot-fade" style={bootDelay(beat.boardHeader)}>
            <span className="flex items-center gap-2.5">
              <LiveDot pulse /> {view.header.live}
            </span>
            <span>{view.header.player}</span>
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
          <Scoreboard.Footer className="animate-boot-fade" style={bootDelay(beat.boardFooter)}>
            {view.footer.map((cell) => (
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
        {/* top-138 not 139: Main's challenge line box is 32px, the type-challenge recipe's is 36px, so the CTAs land on y=618 */}
        <div
          className="absolute inset-x-0 top-138 flex animate-boot-rise flex-col items-center gap-7.5"
          style={bootDelay(beat.ctas)}
        >
          <Text as="p" variant="challenge" tone="body">
            {view.challenge}
          </Text>
          <div className="flex gap-5.5">
            <Button
              as={ArenaLink}
              to={view.enter.to}
              size="xl"
              subLabel={view.enter.sub}
              onClick={audio.unlock}
            >
              {view.enter.label}
            </Button>
            <Button
              as={ArenaLink}
              to={view.view.to}
              size="xl"
              variant="secondary"
              subLabel={view.view.sub}
            >
              {view.view.label}
            </Button>
          </div>
        </div>
        {/* The line mounts at its beat (LandingScreen says it then) and enters with its own animation. */}
        <CommentarySlot tag={view.commTag} className="absolute bottom-9 left-9" />
        <KeyboardHint
          className="absolute right-9 bottom-11.5 animate-boot-fade"
          style={bootDelay(beat.hint)}
        >
          {view.hint}
        </KeyboardHint>
      </Stage>
      {/* Phone and tablet: replaced by the real layout in Task 4. */}
      <div className="lg:hidden">
        <PlaceholderScreen route="home" as="div" announce={false} />
      </div>
    </main>
  );
}
