import {
  useEffect,
  useRef,
  type ComponentProps,
  type ComponentPropsWithRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { useTilt } from "../lib/useTilt";
import { Text } from "../primitives/Text";
import { BrandLockup } from "./BrandLockup";
import { PortraitFrame } from "./PortraitFrame";
import { StatTile } from "./StatTile";

type Side = "front" | "back";

interface FaceProps {
  side: Side;
  hidden: boolean;
  label: string;
  onToggle: (e: MouseEvent<HTMLButtonElement>) => void;
  buttonRef: ComponentPropsWithRef<"button">["ref"];
  children: ReactNode;
}

/**
 * One face. It carries its OWN flip button (named for where it flips to, so it is not a toggle: no `aria-pressed`), laid under the face's content, so a link on the back is never
 * inside a button. The content layer lets clicks fall through to the button, except on links and buttons.
 * Both faces are `backface-visibility: hidden`; the one facing away is `inert` + `aria-hidden`.
 */
function Face({ side, hidden, label, onToggle, buttonRef, children }: FaceProps) {
  return (
    <div
      data-face={side}
      inert={hidden}
      aria-hidden={hidden || undefined}
      className={cn(
        // The artboard's 400x640 content box plus the 1px border: the wrapper is 402x642.
        "absolute inset-0 flex flex-col overflow-hidden border border-volt-a45 backface-hidden",
        "bg-linear-160 from-stand-hi via-stand-3 via-55% to-card-end shadow-holo",
        "transition-colors duration-(--dur-hover) ease-follow group-hover/card:border-volt",
        side === "front"
          ? "motion-reduce:group-data-[flipped=true]/card:invisible"
          : "rotate-y-180 motion-reduce:invisible motion-reduce:rotate-y-0 motion-reduce:group-data-[flipped=true]/card:visible",
      )}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        onClick={onToggle}
        className="absolute inset-0 cursor-pointer focus-visible:-outline-offset-4"
      />
      <div className="pointer-events-none relative flex flex-1 flex-col [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
        {children}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 animate-sheen card-sheen motion-reduce:hidden"
      />
    </div>
  );
}

type PlayerCardProps = {
  /** Which face shows. Controlled: the parent owns it. */
  flipped: boolean;
  onFlip: () => void;
  /** The flip button's accessible name for the current direction ("Flip card: show the back"). */
  label: string;
  /** Front face content. Compose with PlayerCard.Header / Portrait / Name / Stats / Footer, or your own. */
  front: ReactNode;
  /** Back face content. Links here are real links, outside the flip buttons. */
  back: ReactNode;
  /** The slow hover. Off, and always off under reduced motion. */
  float?: boolean;
} & Omit<ComponentPropsWithRef<"div">, "children">;

/**
 * The collector's card: a 400x640 (content box) 3D card (402x642 with its border; narrower on the phone, same
 * proportions, the portrait giving up height and the stat cells stacking) that floats, shows a sheen, tilts toward a fine
 * pointer and flips on click, Enter or Space. Under reduced motion it stands flat and the faces swap.
 *
 * Structure: a still wrapper (perspective, pointer handlers) > tilt layer (GSAP) > float layer (CSS) >
 * flipper (rotateY) > two faces. Each face holds its own flip `<button>` under its content, so the
 * back face's links never nest inside a button.
 */
export function PlayerCard({
  flipped,
  onFlip,
  label,
  front,
  back,
  float = true,
  className,
  ...rest
}: PlayerCardProps) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const frontButton = useRef<HTMLButtonElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const tilt = useTilt(tiltRef, { max: 6, lift: 8 });
  const latest = useRef(flipped);
  useEffect(() => {
    latest.current = flipped;
  }, [flipped]);

  function toggle(e: MouseEvent<HTMLButtonElement>) {
    // A drag that ended on the card tilted it; it must not also flip it.
    if (tilt.consumeDrag()) return;
    // The face this button is on is about to go inert: hand focus over, so a keyboard user keeps their place.
    e.currentTarget.blur();
    onFlip();
    setTimeout(() => (latest.current ? backButton : frontButton).current?.focus(), 0);
  }

  return (
    <div
      {...rest}
      data-player-card=""
      data-flipped={flipped}
      onPointerDown={tilt.onPointerDown}
      onPointerMove={tilt.onPointerMove}
      onPointerUp={tilt.onPointerUp}
      onPointerLeave={tilt.onPointerLeave}
      className={cn(
        // The drawn 402x642 box. On the phone it is as wide as the column allows (never wider than drawn) and keeps
        // its proportions, so the text inside stays at full size.
        "group/card relative aspect-402/642 w-100.5 perspective-card max-md:w-full max-md:max-w-100.5",
        className,
      )}
    >
      <div ref={tiltRef} className="size-full transform-3d">
        <div className={cn("size-full transform-3d", float && "animate-card-float")}>
          <div className="relative size-full transition-transform duration-(--dur-follow) ease-swing transform-3d group-data-[flipped=true]/card:rotate-y-180 motion-reduce:transition-none motion-reduce:group-data-[flipped=true]/card:rotate-y-0">
            <Face
              side="front"
              hidden={flipped}
              label={label}
              onToggle={toggle}
              buttonRef={frontButton}
            >
              {front}
            </Face>
            <Face
              side="back"
              hidden={!flipped}
              label={label}
              onToggle={toggle}
              buttonRef={backButton}
            >
              {back}
            </Face>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Top row: the position badge on the left, the brand mark and the season on the right. */
function CardHeader({
  position,
  mark,
  season,
  className,
  ...rest
}: {
  position: { value: string; label: string };
  mark: string;
  season: ReactNode;
} & ComponentProps<"div">) {
  return (
    <div className={cn("flex items-start justify-between px-6 pt-5.5", className)} {...rest}>
      <div className="flex flex-col gap-0.5">
        <Text variant="card-position" tone="volt">
          {position.value}
        </Text>
        <Text variant="mono-label" tone="label" leading="font">
          {position.label}
        </Text>
      </div>
      <div className="flex flex-col items-end gap-1">
        <BrandLockup mark={mark} />
        <Text variant="mono-label" tone="label" leading="font">
          {season}
        </Text>
      </div>
    </div>
  );
}

/** The head shot in its volt-glow frame, inset to the card's 24px margins. */
function CardPortrait({ className, ...rest }: Omit<ComponentProps<typeof PortraitFrame>, "size">) {
  return <PortraitFrame size="card" className={cn("mx-6 mt-1.5", className)} {...rest} />;
}

/** The player's name and the line under it, centred. */
function CardName({
  name,
  line,
  className,
  ...rest
}: { name: string; line: string } & Omit<ComponentProps<"div">, "children">) {
  return (
    <div className={cn("flex flex-col items-center gap-1 px-6 pt-4", className)} {...rest}>
      <Text variant="card-name">{name}</Text>
      <Text variant="mono-brand" tone="secondary" leading="font">
        {line}
      </Text>
    </div>
  );
}

/** A 3-column grid of stat cells (label left, value right); `accent` paints a value volt. */
function CardStats({
  stats,
  className,
  ...rest
}: {
  stats: { label: string; value: string; accent?: boolean }[];
} & Omit<ComponentProps<"div">, "children">) {
  return (
    <div
      className={cn("mx-6 mt-4.5 grid grid-cols-3 gap-px border border-line bg-line", className)}
      {...rest}
    >
      {stats.map((s) => (
        <StatTile key={s.label} tone="cell" label={s.label} value={s.value} accent={s.accent} />
      ))}
    </div>
  );
}

/** A way to reach the player, pinned to the foot of a face (above CardFooter): a small label over a link. */
function CardContact({
  label,
  value,
  href,
  className,
  ...rest
}: { label: ReactNode; value: ReactNode; href: string } & Omit<ComponentProps<"div">, "children">) {
  return (
    <div
      className={cn("mx-6 mt-auto mb-3 flex flex-col gap-0.5 border-t border-line pt-3", className)}
      {...rest}
    >
      <Text variant="mono-label" tone="label" leading="font">
        {label}
      </Text>
      <Text
        as="a"
        href={href}
        variant="mono-brand"
        tone="primary"
        leading="font"
        className="hover:text-volt"
      >
        {value}
      </Text>
    </div>
  );
}

/** The foot line, pinned to the bottom of the face. */
function CardFooter({
  left,
  right,
  className,
  ...rest
}: { left: ReactNode; right: ReactNode } & Omit<ComponentProps<"div">, "children">) {
  return (
    <div
      className={cn(
        "mt-auto flex justify-between gap-4 border-t border-line px-6 py-3.5",
        className,
      )}
      {...rest}
    >
      <Text variant="mono-label" tone="dim" leading="font">
        {left}
      </Text>
      <Text variant="mono-label" tone="dim" leading="font">
        {right}
      </Text>
    </div>
  );
}

PlayerCard.Header = CardHeader;
PlayerCard.Portrait = CardPortrait;
PlayerCard.Name = CardName;
PlayerCard.Stats = CardStats;
PlayerCard.Contact = CardContact;
PlayerCard.Footer = CardFooter;
