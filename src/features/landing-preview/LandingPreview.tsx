import { useEffect } from "react";
import { content, ui } from "@/content";
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
import { CommentarySlot, useCommentary } from "@/shell/commentary";
import { ROUTES } from "@/shell/routes";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";

/** Static Landing composition (Phase 3 adds the floodlight boot + intro choreography). */
export function LandingPreview() {
  const audio = useAudio();
  const { say } = useCommentary();
  useEffect(() => say(content.commentary.entrance[0]!, { interrupt: true }), [say]);

  // One <main> for the page; desktop Stage and mobile placeholder are mutually exclusive by breakpoint.
  return (
    <main id="main">
      <div className="max-md:hidden">
        <Stage backdrop={<ArenaBackdrop bleed />}>
          <HUD
            className="absolute inset-x-0 top-0"
            left={<BrandLockup mark={ui.brand.mark} label={ui.brand.wordmark} />}
            right={
              <>
                <AudioToggle
                  name={ui.audio.name}
                  label={ui.audio.label}
                  stateOn={ui.audio.on}
                  stateOff={ui.audio.off}
                  on={audio.enabled}
                  onToggle={audio.toggle}
                />
                <HUDButton as={ArenaLink} to={ROUTES.arena}>
                  {ui.hud.skipIntro}
                </HUDButton>
              </>
            }
          />
          <Scoreboard className="absolute top-35 left-67.5 h-93.5 w-225.5">
            <Scoreboard.Header>
              <span className="flex items-center gap-2.5">
                <LiveDot pulse /> {ui.landing.live}
              </span>
              <span>{ui.landing.player}</span>
            </Scoreboard.Header>
            <Scoreboard.Body>
              <Scoreboard.Title as="h1">{content.player.name}</Scoreboard.Title>
              <Scoreboard.Subtitle>{content.player.title}</Scoreboard.Subtitle>
            </Scoreboard.Body>
            <Scoreboard.Footer>
              <Scoreboard.FooterCell
                label={ui.landing.home}
                value={content.player.name.split(" ")[0]!}
              />
              <Scoreboard.FooterCell
                label={ui.landing.status}
                value={ui.landing.undefeated}
                tone="volt"
                align="center"
              />
              <Scoreboard.FooterCell
                label={ui.landing.away}
                value={ui.landing.you}
                tone="label"
                align="end"
              />
            </Scoreboard.Footer>
          </Scoreboard>
          {/* top-138 not 139: Main's challenge line box is 32px, the type-challenge recipe's is 36px, so the CTAs land on y=618 */}
          <div className="absolute inset-x-0 top-138 flex flex-col items-center gap-7.5">
            <Text as="p" variant="challenge" tone="body">
              {ui.landing.challenge}
            </Text>
            <div className="flex gap-5.5">
              <Button
                as={ArenaLink}
                to={ROUTES.intro}
                size="xl"
                subLabel={ui.landing.enterSub}
                onClick={audio.unlock}
              >
                {ui.landing.enter}
              </Button>
              <Button
                as={ArenaLink}
                to={ROUTES.scout}
                size="xl"
                variant="secondary"
                subLabel={ui.landing.viewSub}
              >
                {ui.landing.view}
              </Button>
            </div>
          </div>
          <CommentarySlot tag={ui.comm.tag} className="absolute bottom-9 left-9" />
          <KeyboardHint className="absolute right-9 bottom-11.5">{ui.landing.hint}</KeyboardHint>
        </Stage>
      </div>
      <div className="md:hidden">
        <PlaceholderScreen route="home" as="div" announce={false} />
      </div>
    </main>
  );
}
