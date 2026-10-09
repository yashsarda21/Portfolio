import { cn } from "@/lib/cn";
import { Glass } from "../primitives/Glass";

export type RevealSlotProps =
  | { state: "open"; eyebrow: string; title: string; meta: string }
  | { state: "locked"; label: string; hint: string };

/**
 * The STADIUM SCREEN (Cricket-Play): the panel of what the game has unlocked. Open slots pop in with their
 * eyebrow, title and meta; locked slots say what unlocks them. Both are content, so unlike the meters it is
 * read by assistive tech. To pop a slot in again, change its place in `slots` (a slot opening mounts its row).
 */
export function RevealList({
  title,
  count,
  slots,
  className,
}: {
  title: string;
  count: string;
  slots: readonly RevealSlotProps[];
  className?: string;
}) {
  return (
    <Glass
      as="section"
      aria-label={title}
      pad="md"
      className={cn("flex flex-col gap-3", className)}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-normal type-mono-label text-scout">{title}</h2>
        <span className="type-mono-xs text-volt">{count}</span>
      </div>
      <ul className="flex flex-col gap-3">
        {slots.map((slot, i) => (
          <li
            // The slots are a fixed list in a fixed order: a slot's place is its identity.
            key={i}
            data-state={slot.state}
            className="border-t border-line pt-3"
          >
            {slot.state === "open" ? (
              <div className="flex animate-pop flex-col gap-1">
                <span className="type-mono-tag leading-auto text-volt">{slot.eyebrow}</span>
                <span className="type-d4s leading-auto">{slot.title}</span>
                <span className="type-body-sm leading-auto text-text-2">{slot.meta}</span>
              </div>
            ) : (
              <div className="flex h-14 items-center justify-between">
                <span className="type-mono-tag leading-auto text-dim">{slot.label}</span>
                <span className="type-mono-note text-dim">{slot.hint}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Glass>
  );
}

/** The phone's single reveal (Mobile-Game): the latest unlock in a solid chip under the score. Content, so it is read. */
export function RevealChip({
  eyebrow,
  title,
  meta,
  className,
}: {
  eyebrow: string;
  title: string;
  meta: string;
  className?: string;
}) {
  return (
    <Glass
      surface="solid"
      edge="volt"
      className={cn("flex animate-pop flex-col gap-0.5 px-3.5 py-3", className)}
    >
      <span className="type-mono-round text-volt">{eyebrow}</span>
      <span className="type-title-chip">{title}</span>
      <span className="type-caption leading-auto text-text-2">{meta}</span>
    </Glass>
  );
}
