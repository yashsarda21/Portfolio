import { useMemo, type CSSProperties, type Ref } from "react";
import {
  ArenaBackdrop,
  BrandLockup,
  Button,
  HUD,
  HUDButton,
  LiveDot,
  Scoreboard,
  SpriteStrip,
  Stage,
  Text,
} from "@/design-system";
import type { TextTone } from "@/design-system";
import { cn } from "@/lib/cn";
import { ArenaLink } from "@/shell/ArenaLink";
import { useAudio } from "@/shell/audio";
import { CommentarySlot } from "@/shell/commentary";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import portraitRest from "@/assets/portrait-rest.webp?url";
import turn0 from "@/assets/rig/turn_0.webp?url";
import turn1 from "@/assets/rig/turn_1.webp?url";
import turn2 from "@/assets/rig/turn_2.webp?url";
import { createLetters } from "./letters";
import { createPixels, type PixelColor } from "./pixels";
import type { IntroView } from "./view";

const STRIPS = [turn0, turn1, turn2] as const;
const PIXELS = createPixels();

const PIXEL_CLASS: Record<PixelColor, string> = {
  volt: "intro-pixel-volt",
  led: "intro-pixel-led",
  warm: "intro-pixel-warm",
};

const TAGLINE_TONE: Record<IntroView["tagline"][number]["tone"], TextTone> = {
  primary: "primary",
  secondary: "secondary",
  volt: "volt",
};

// The motion trail behind the silhouette, in the trail box's own coordinates (Intro.dc.html): five streaks
// and six specks of light. Class strings stay literal so Tailwind sees them.
const TRAIL_STREAKS = [
  "top-30 right-0 h-0.75 w-165 bg-linear-90 from-volt/0 to-volt shadow-[0_0_14px] shadow-volt",
  "top-44.5 right-7.5 h-0.5 w-125 bg-linear-90 from-ember/0 to-ember",
  "top-62.5 right-0 h-1.5 w-150 bg-linear-90 from-white/0 to-white/70 blur-[2px]",
  "top-82.5 right-10 h-0.5 w-105 bg-linear-90 from-volt/0 to-volt/80",
  "top-98.75 right-5 h-0.75 w-130 bg-linear-90 from-ember/0 to-ember/70",
] as const;
const TRAIL_SPECKS = [
  "top-24 right-17.5 size-1.5 bg-volt shadow-[0_0_10px] shadow-volt",
  "top-39 right-47.5 size-1 bg-white",
  "top-71.5 right-32.5 size-1.25 bg-ember",
  "top-54 right-77.5 size-1 bg-volt",
  "top-34 right-110 size-0.75 bg-white",
  "top-87.5 right-65 size-1 bg-volt",
] as const;

/** The head turn's first frame, tinted: volt for the nearer ghost, warm for the farther. */
const GHOST_TINT = ["intro-ghost-volt", "intro-ghost-warm"] as const;

/**
 * The Player Introduction. From 768px up (desktop and tablet, L1) the 1440x900 stage plays the intro: a
 * timeline (useIntroTimeline) lights the scene, swings the silhouette in, locks the name in and finishes with
 * the call to action. Below 768px the route keeps its placeholder until the phone cut exists.
 *
 * `data-intro` on the root says where the show is (pending, playing, done). While it is pending, every part the
 * timeline reveals carries `intro-part` and is hidden by CSS, scenery included, so nothing shows lit before
 * the first frame. Everything is addressed by `data-part`; the page holds no timing and no copy.
 */
export function IntroPage({
  view,
  rootRef,
  onReplay,
}: {
  view: IntroView;
  rootRef?: Ref<HTMLElement>;
  onReplay?: () => void;
}) {
  const audio = useAudio();
  const letters = useMemo(() => createLetters(view.name), [view.name]);

  return (
    <main id="main" ref={rootRef} data-intro="pending">
      <Stage
        from="md"
        backdrop={<ArenaBackdrop layout="intro" bleed dust layerClassName="intro-part" />}
        skyClassName="intro-part"
      >
        <HUD
          className="absolute inset-x-0 top-0 z-9"
          left={<BrandLockup mark={view.brand.mark} />}
          right={
            <>
              <HUDButton onClick={onReplay} className="motion-reduce:hidden">
                {view.replay}
              </HUDButton>
              <HUDButton as={ArenaLink} to={view.skip.to}>
                {view.skip.label}
              </HUDButton>
            </>
          }
        />

        {/* h-135.5 w-310.5: the board is 1240x540 inside its 1px border (the artboard sizes the content box), so 1242x542 outside. */}
        <Scoreboard.Power className="top-24 left-25 h-135.5 w-310.5" />
        <Scoreboard size="intro" className="absolute top-24 left-25 h-135.5 w-310.5">
          <Scoreboard.Header data-part="board-header" className="intro-part">
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
            className="pointer-events-none intro-part absolute -right-10 bottom-7.5 h-130 w-175 intro-backlight"
          />
          <Scoreboard.Scan variant="bar" />

          {GHOST_TINT.map((tint) => (
            <div
              key={tint}
              aria-hidden="true"
              data-part="ghost"
              className="pointer-events-none invisible absolute right-9 bottom-16 z-1 h-112.75 w-140"
            >
              <SpriteStrip deferred src={turn0} className={cn("intro-turn size-full", tint)} />
            </div>
          ))}

          <div
            aria-hidden="true"
            data-part="shock"
            className="pointer-events-none invisible absolute top-12 right-140 bottom-16 z-2 w-1.5 origin-left bg-linear-180 from-volt/0 via-volt to-volt/0 shadow-[0_0_30px] shadow-volt"
          />

          <div
            data-part="mover"
            className="intro-part absolute right-9 bottom-16 z-3 h-112.75 w-140"
          >
            <div
              aria-hidden="true"
              data-part="trails"
              className="pointer-events-none invisible absolute top-0 -left-150 h-112.75 w-170"
            >
              {[...TRAIL_STREAKS, ...TRAIL_SPECKS].map((classes) => (
                <span key={classes} className={cn("absolute", classes)} />
              ))}
            </div>

            <div
              data-part="fig"
              role="img"
              aria-label={view.portraitAlt}
              className="absolute inset-0 intro-edge-mask intro-fig"
            >
              <div data-part="idle" className="absolute inset-0">
                {STRIPS.map((src) => (
                  <SpriteStrip
                    key={src}
                    deferred
                    src={src}
                    aria-hidden="true"
                    data-part="turn"
                    className="intro-turn absolute inset-0"
                  />
                ))}
                {/* The pose the head turn rests on, and what stands when it cannot play. */}
                <img
                  data-part="rest"
                  src={portraitRest}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 size-full"
                />
                <div
                  aria-hidden="true"
                  data-part="sweep"
                  className="absolute inset-0"
                  style={{ "--mask": `url("${portraitRest}")` } as CSSProperties}
                />
              </div>
            </div>

            <div
              aria-hidden="true"
              data-part="streak"
              className="pointer-events-none invisible absolute top-41.25 left-15 z-2 h-0.5 w-115 origin-center intro-streak"
            />
            {(["left-61", "left-78.5"] as const).map((x) => (
              <div
                key={x}
                aria-hidden="true"
                data-part="glint"
                className={cn(
                  "pointer-events-none invisible absolute top-40 z-2 size-3 rounded-full intro-glint",
                  x,
                )}
              />
            ))}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-3 intro-led-grid"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-3 intro-scanlines"
            />
          </div>

          {PIXELS.map((pixel, i) => (
            <span
              key={i}
              aria-hidden="true"
              data-part="pixel"
              className="pointer-events-none invisible absolute z-4 size-0 origin-top-left"
              style={{ left: pixel.x, top: pixel.y }}
            >
              <span
                data-part="pixel-dot"
                className={cn("absolute", PIXEL_CLASS[pixel.color])}
                style={{ left: pixel.dx, top: pixel.dy, width: pixel.size, height: pixel.size }}
              />
            </span>
          ))}

          <div className="absolute top-37.5 left-14 z-4 flex flex-col gap-4.5">
            <Scoreboard.Title as="h1" aria-label={view.heading} className="whitespace-nowrap">
              {letters.map((letter, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  data-part="letter"
                  data-kind={letter.kind}
                  className={cn("intro-part intro-letter", letter.ch === " " && "intro-letter-gap")}
                >
                  {letter.ch}
                </span>
              ))}
            </Scoreboard.Title>
            <div className="relative h-9.5">
              <Scoreboard.Subtitle data-part="title" className="intro-part block whitespace-nowrap">
                {view.title}
              </Scoreboard.Subtitle>
              <span
                aria-hidden="true"
                data-part="title-bar"
                className="invisible absolute -top-1 left-0 h-11.5 w-1 bg-led shadow-[0_0_16px] shadow-volt"
              />
            </div>
            <p className="flex items-center gap-3">
              {view.tagline.map((part, i) => (
                <Text
                  key={i}
                  variant="mono-lg"
                  leading="font"
                  tone={TAGLINE_TONE[part.tone]}
                  aria-hidden={part.kind === "sep" ? true : undefined}
                  data-part="tagline"
                  className="intro-part"
                >
                  {part.text}
                </Text>
              ))}
            </p>
          </div>

          <Scoreboard.Footer data-part="board-strip" className="intro-part">
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

        <div
          aria-hidden="true"
          data-part="flash"
          className="pointer-events-none invisible absolute inset-0 z-6 intro-flash"
        />

        <div className="absolute inset-x-0 top-167 z-7 flex flex-col items-center gap-5.5">
          <Text as="p" variant="welcome" tone="primary" data-part="welcome" className="intro-part">
            {view.welcome}
          </Text>
          <Button
            as={ArenaLink}
            to={view.enter.to}
            size="2xl"
            data-part="cta"
            className="intro-part intro-cta"
            onClick={audio.unlock}
          >
            {view.enter.label}
          </Button>
        </div>

        {/* The line mounts at its beat (IntroScreen says it then) and enters with its own animation. */}
        <CommentarySlot tag={view.commTag} className="absolute bottom-9 left-9 z-7" />
      </Stage>

      <div className="md:hidden">
        <PlaceholderScreen route="intro" as="div" announce={false} />
      </div>
    </main>
  );
}
