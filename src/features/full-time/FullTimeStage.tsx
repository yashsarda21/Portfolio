import {
  Button,
  FloorPool,
  Glass,
  HUD,
  Heading,
  IconToast,
  MonoLabel,
  ResultBoard,
  SpotBeam,
  Stage,
  Text,
} from "@/design-system";
import { ArenaLink, TunnelLink } from "@/shell/ArenaLink";
import { BackChip } from "@/shell/BackChip";
import { CommentarySlot } from "@/shell/commentary";
import { QuickViewChip } from "@/shell/QuickViewChip";
import type { CSSProperties } from "react";
import type { FullTimeView } from "./view";

/** The four motes of dust in the beam, each at its drawn spot, size and turn (a literal class per mote so Tailwind generates them). */
const MOTES = [
  { at: "top-150 left-172.5 size-0.75 bg-volt", delay: 0 },
  { at: "top-170 left-185 size-0.5 bg-volt-hover", delay: 1.2 },
  { at: "top-180 left-165 size-0.5 bg-volt", delay: 2.4 },
  { at: "top-140 left-192.5 size-0.75 bg-volt-hover", delay: 3.1 },
] as const;

const after = (seconds: number) => ({ "--d": `${seconds}s` }) as CSSProperties;

/**
 * Full Time at 1440×900, from 1200px (Easter-Egg, flipped): one spotlight and the pool it lands in, the toast, the
 * board, the verdict, the card, the links, COMM and the note, each at its drawn place. They arrive as drawn: the
 * toast 0.4s, the verdict 0.9s, the card 1.5s, the links 1.9s. `ready` is false until the saved record has loaded;
 * the parts that depend on it are hidden until then (H5), so a returning visitor never sees "NOT YET." flash by.
 */
export function FullTimeStage({ view, ready }: { view: FullTimeView; ready: boolean }) {
  const pending = ready ? {} : { "data-record-pending": "" };
  const Cta = view.state === "pending" ? TunnelLink : ArenaLink;
  return (
    <Stage from="lg" className="bg-void" skyClassName="hidden">
      <SpotBeam className="-top-10 left-117.5 h-245 w-125" />
      <FloorPool className="top-185 left-105 h-30 w-150" />
      {MOTES.map(({ at, delay }) => (
        <span
          key={at}
          aria-hidden="true"
          className={`pointer-events-none absolute animate-mote rounded-full ${at}`}
          style={after(delay)}
        />
      ))}
      {/* QUICK VIEW, top-right as on the Hub and the game stages (A5: the artboard draws none, every cinematic screen has one). */}
      <HUD
        className="absolute inset-x-0 top-0 z-10"
        left={<BackChip />}
        right={<QuickViewChip />}
      />
      <div
        className="absolute inset-x-0 top-10 flex animate-drop justify-center"
        style={after(0.4)}
      >
        <IconToast
          icon="trophy"
          eyebrow={view.toast.eyebrow}
          title={view.toast.title}
          eyebrowProps={pending}
        />
      </div>
      <div className="absolute inset-x-0 top-37.5 flex justify-center" {...pending}>
        <ResultBoard {...view.board} glitch />
      </div>
      <div
        className="absolute inset-x-0 top-67.5 flex animate-rise-text flex-col items-center gap-3.5"
        style={after(0.9)}
      >
        <Heading
          level={1}
          variant="hero-verdict"
          className="text-center glow-volt-wide"
          {...pending}
        >
          {view.headline}
        </Heading>
        <Text as="p" variant="verdict-line" tone="body" {...pending}>
          {view.line}
        </Text>
      </div>
      <Glass
        edge="volt"
        {...pending}
        className="absolute inset-x-0 top-130 mx-auto grid w-180 animate-rise grid-cols-[minmax(0,1fr)_auto] items-center gap-5 px-7 py-6"
        style={after(1.5)}
      >
        <div className="flex flex-col gap-1.5">
          <MonoLabel tone="volt">{view.card.eyebrow}</MonoLabel>
          <Text as="span" variant="title-panel">
            {view.card.title}
          </Text>
          <Text as="span" variant="body-copy" tone="secondary">
            {view.card.body}
          </Text>
        </div>
        <Button
          as={Cta}
          to={view.card.cta.to}
          skew
          glow={false}
          className="h-15.5 px-7 type-btn-bar-lg"
        >
          {view.card.cta.label}
        </Button>
      </Glass>
      <div
        {...pending}
        className="absolute inset-x-0 top-175 flex animate-rise justify-center gap-3.5"
        style={after(1.9)}
      >
        {view.links.map((link) => (
          <Glass
            key={link.to}
            as={ArenaLink}
            to={link.to}
            className="flex h-12.5 items-center px-5.5 type-mono-md text-floodlight transition-colors duration-(--dur-snap) ease-snap hover:text-volt-hover"
          >
            {link.label}
          </Glass>
        ))}
      </div>
      <CommentarySlot tag={view.commTag} className="absolute bottom-9 left-9" />
      {view.note ? (
        <Text
          as="span"
          variant="mono-nav"
          tone="dim"
          className="absolute right-9 bottom-12 whitespace-nowrap"
        >
          {view.note}
        </Text>
      ) : null}
    </Stage>
  );
}
