import {
  BrandLockup,
  Button,
  CrowdTier,
  FloodlightBank,
  HUDButton,
  LiveDot,
  Scoreboard,
  SkyGlow,
  Text,
  VenueGlow,
} from "@/design-system";
import type { TextTone } from "@/design-system";
import { cn } from "@/lib/cn";
import { ArenaLink } from "@/shell/ArenaLink";
import { useAudio } from "@/shell/audio";
import portraitRest from "@/assets/portrait-rest.webp?url";
import type { IntroLetter } from "./letters";
import type { IntroView } from "./view";

const TAGLINE_TONE: Record<IntroView["tagline"][number]["tone"], TextTone> = {
  primary: "primary",
  secondary: "secondary",
  volt: "volt",
};

/** The rest portrait's own size, so the browser holds its place before it has loaded. */
const PORTRAIT = { width: 700, height: 564 } as const;

/**
 * The name's letters grouped into words: a word never breaks, so the stacked name wraps between YASH and SARDA
 * only. The space between the words stays a letter of its own (the timeline's plan counts it) but draws nothing.
 */
function words(letters: IntroLetter[]): { letter: IntroLetter; key: number }[][] {
  const lines: { letter: IntroLetter; key: number }[][] = [[]];
  letters.forEach((letter, key) => {
    if (letter.ch === " ") lines.push([]);
    lines.at(-1)!.push({ letter, key });
  });
  return lines;
}

/**
 * The Player Introduction below 768px (L6): the phone's two-second cut, derived from the Mobile-Landing frame
 * since no board exists for it. A flex column, so a short phone scrolls instead of clipping. The rest portrait
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
  const audio = useAudio();

  return (
    <div
      data-intro-layout="column"
      data-venue="turf"
      className="relative flex min-h-dvh flex-col bg-night md:hidden"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <SkyGlow w="90%" h="40%" alpha={0.2} />
        <VenueGlow y="100%" w="120%" h="30%" alpha={0.35} />
        <div className="relative h-full">
          <FloodlightBank data-part="bank-1" size="mobile" className="intro-part top-14 left-7.5" />
          <FloodlightBank
            data-part="bank-2"
            size="mobile"
            className="intro-part top-14 right-7.5"
          />
        </div>
        <CrowdTier flat alpha={0.22} className="-inset-x-5 top-105 h-40 opacity-100" />
      </div>

      <div className="relative flex w-full flex-1 flex-col px-4 pt-4 pb-10">
        <div className="flex items-center justify-between gap-2">
          <BrandLockup mark={view.brand.mark} size="sm" />
          <div className="flex items-center gap-2">
            <HUDButton
              tone="glass-compact"
              onClick={onReplay}
              aria-disabled={onReplay ? undefined : true}
              className="aria-disabled:opacity-50 motion-reduce:hidden"
            >
              {view.replay}
            </HUDButton>
            <HUDButton tone="glass-compact" as={ArenaLink} to={view.skip.to}>
              {view.skip.label}
            </HUDButton>
          </div>
        </div>

        <div className="mt-6">
          <Scoreboard size="compact">
            <Scoreboard.Header data-part="board-header" className="intro-part">
              <span className="flex items-center gap-2 whitespace-nowrap">
                <LiveDot size={6} /> <span>{view.header.live}</span>
              </span>
              {/* The 360px phone has no room for the counter beside the longer label. */}
              <span className="max-[23rem]:hidden">{view.header.count}</span>
            </Scoreboard.Header>
            <Scoreboard.Body>
              <img
                data-part="portrait"
                src={portraitRest}
                alt=""
                width={PORTRAIT.width}
                height={PORTRAIT.height}
                decoding="async"
                className="intro-part h-auto w-3/4 portrait-fade"
              />
              <Scoreboard.Title as="h1" aria-label={view.heading}>
                {words(letters).map((word, w) => (
                  <span key={w} className="block whitespace-nowrap">
                    {word.map(({ letter, key }) => (
                      <span
                        key={key}
                        aria-hidden="true"
                        data-part="letter"
                        data-kind={letter.kind}
                        className={cn(
                          "intro-part intro-letter",
                          letter.ch === " " && "hidden intro-letter-gap",
                        )}
                      >
                        {letter.ch}
                      </span>
                    ))}
                  </span>
                ))}
              </Scoreboard.Title>
              <div className="relative">
                <Scoreboard.Subtitle
                  data-part="title"
                  className="intro-part block whitespace-nowrap"
                >
                  {view.title}
                </Scoreboard.Subtitle>
                <span
                  aria-hidden="true"
                  data-part="title-bar"
                  className="invisible absolute -inset-y-1 left-0 w-1 bg-led shadow-[0_0_16px] shadow-volt"
                />
              </div>
              <p className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
                {view.tagline.map((part, i) => (
                  <Text
                    key={i}
                    variant="mono-md"
                    leading="font"
                    tone={TAGLINE_TONE[part.tone]}
                    aria-hidden={part.kind === "sep" ? true : undefined}
                    data-part="tagline"
                    className="intro-part whitespace-nowrap"
                  >
                    {part.text}
                  </Text>
                ))}
              </p>
            </Scoreboard.Body>
            <Scoreboard.Footer data-part="board-strip" className="intro-part">
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

        <div className="mt-auto flex flex-col gap-3 pt-6">
          <Text
            as="p"
            variant="welcome"
            tone="primary"
            data-part="welcome"
            className="intro-part text-center"
          >
            {view.welcome}
          </Text>
          <Button
            as={ArenaLink}
            to={view.enter.to}
            size="bar-lg"
            skew={false}
            data-part="cta"
            className="intro-part intro-cta"
            onClick={audio.unlock}
          >
            {view.enter.label}
          </Button>
        </div>
      </div>
    </div>
  );
}
