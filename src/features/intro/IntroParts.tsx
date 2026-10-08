import { Button, HUDButton, Scoreboard, Text } from "@/design-system";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { ArenaLink } from "@/shell/ArenaLink";
import { useAudio } from "@/shell/audio";
import type { IntroLetter } from "./letters";
import type { IntroView, TaglinePart } from "./view";

/*
 * The parts the stage and the phone column both draw, written once. They name themselves with `data-part`, so
 * one timeline factory finds them in either layout.
 */

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
 * The page's <h1>: the name as one decorative span per letter (its accessible name is `heading`). `stacked`
 * sets it one word to a line, as the phone's narrow board does; the wide board runs it on one line.
 */
export function IntroName({
  heading,
  letters,
  stacked = false,
}: {
  heading: string;
  letters: IntroLetter[];
  stacked?: boolean;
}) {
  const letter = ({ letter: l, key }: { letter: IntroLetter; key: number }) => (
    <span
      key={key}
      aria-hidden="true"
      data-part="letter"
      data-kind={l.kind}
      className={cn(
        "hold-part intro-letter",
        l.ch === " " && ["intro-letter-gap", stacked && "hidden"],
      )}
    >
      {l.ch}
    </span>
  );
  const all = letters.map((l, key) => ({ letter: l, key }));
  return (
    <Scoreboard.Title as="h1" aria-label={heading} className={cn(!stacked && "whitespace-nowrap")}>
      {stacked
        ? words(letters).map((word, w) => (
            <span key={w} className="block whitespace-nowrap">
              {word.map(letter)}
            </span>
          ))
        : all.map(letter)}
    </Scoreboard.Title>
  );
}

/** The subtitle with the white bar that leads its wipe. Size the box with `className` (the stage fixes its height). */
export function IntroTitle({ title, className }: { title: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Scoreboard.Subtitle data-part="title" className="hold-part block whitespace-nowrap">
        {title}
      </Scoreboard.Subtitle>
      <span
        aria-hidden="true"
        data-part="title-bar"
        className="invisible absolute -inset-y-1 left-0 w-1 bg-led shadow-glow-volt-md"
      />
    </div>
  );
}

// The wide board's tagline ends before the portrait (max-w-140, 560px: the portrait starts at x 644 on the
// board); its 12px gap is the row gap too, so the 11px floor on a tablet wraps the tagline instead of running
// into the figure. The phone's is centred under the name in a smaller face.
const TAGLINE = {
  stage: { row: "flex max-w-140 flex-wrap items-center gap-3", text: "mono-lg" },
  column: {
    row: "flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1",
    text: "mono-md",
  },
} as const;

/** The words of the tagline and the volt bullets between them. */
export function IntroTagline({
  parts,
  variant,
}: {
  parts: TaglinePart[];
  variant: keyof typeof TAGLINE;
}) {
  return (
    <p className={TAGLINE[variant].row}>
      {parts.map((part, i) => (
        <Text
          key={i}
          variant={TAGLINE[variant].text}
          leading="font"
          tone={part.tone}
          aria-hidden={part.kind === "sep" ? true : undefined}
          data-part="tagline"
          className="hold-part whitespace-nowrap"
        >
          {part.text}
        </Text>
      ))}
    </p>
  );
}

/**
 * REPLAY and SKIP INTRO. REPLAY does nothing until there is a show to replay (`onReplay` left out): it is then
 * disabled. Reduced motion has nothing to replay, so it is gone.
 */
export function IntroControls({
  view,
  onReplay,
  tone,
}: {
  view: Pick<IntroView, "replay" | "skip">;
  onReplay?: () => void;
  tone?: ComponentProps<typeof HUDButton>["tone"];
}) {
  return (
    <>
      <HUDButton
        tone={tone}
        onClick={onReplay}
        aria-disabled={onReplay ? undefined : true}
        className="aria-disabled:opacity-50 motion-reduce:hidden"
      >
        {view.replay}
      </HUDButton>
      <HUDButton tone={tone} as={ArenaLink} to={view.skip.to}>
        {view.skip.label}
      </HUDButton>
    </>
  );
}

/** WELCOME TO MY ARENA. */
export function IntroWelcome({ text, className }: { text: string; className?: string }) {
  return (
    <Text
      as="p"
      variant="welcome"
      tone="primary"
      data-part="welcome"
      className={cn("hold-part", className)}
    >
      {text}
    </Text>
  );
}

/** The call to action: the stage's skewed 2xl button, or the phone's full-width bar. */
export function IntroEnter({
  enter,
  variant,
}: {
  enter: IntroView["enter"];
  variant: "stage" | "column";
}) {
  const audio = useAudio();
  return (
    <Button
      as={ArenaLink}
      to={enter.to}
      {...(variant === "stage" ? { size: "2xl" } : { size: "bar-lg", skew: false })}
      data-part="cta"
      className="hold-part intro-cta"
      onClick={audio.unlock}
    >
      {enter.label}
    </Button>
  );
}
