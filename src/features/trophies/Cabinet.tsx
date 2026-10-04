import { ui } from "@/content";
import { cn } from "@/lib/cn";
import { CabinetGlass, SelectableList, ShelfLight, Spotlight, Text, Trophy } from "@/design-system";
import type { TrophiesView, TrophyView } from "./view";

/** Three trophies to a shelf. */
const PER_SHELF = 3;

/** One trophy on its shelf: the light, the art on its plinth, the name. It is a tab; the locked one is disabled. */
function Cell({
  trophy,
  index,
  selected,
}: {
  trophy: TrophyView;
  index: number;
  selected: boolean;
}) {
  const { id, kind, title, shelfSub, locked, label } = trophy;
  const topShelf = index < PER_SHELF;
  return (
    <SelectableList.Item
      value={id}
      variant="bare"
      disabled={locked}
      // A locked trophy is announced with its hint, not its decoration.
      aria-label={locked ? `${title}, ${ui.pages.trophies.lockedHint}` : undefined}
      className={cn(
        "relative flex flex-col items-center text-center transition-transform duration-400 ease-follow enabled:hover:-translate-y-1.5 md:justify-end",
        // Tablet keeps the shelf heights the cabinet is drawn with (a 300px and a 260px light); the desktop grid sets its own.
        topShelf ? "pb-4 md:max-[1199px]:min-h-77.5" : "pb-5 md:max-[1199px]:min-h-65",
      )}
    >
      {locked ? null : (
        <Spotlight
          index={index}
          size={topShelf ? "lg" : "md"}
          intensity={selected ? "lead" : "support"}
          className="max-md:origin-top max-md:scale-75"
        />
      )}
      {/* On the phone every figure stands in a box of one height, so the plinths line up however many lines the names take. */}
      <span className="max-md:flex max-md:h-36 max-md:items-end md:contents">
        <Trophy
          kind={kind}
          label={label}
          spinning={selected && !locked}
          className="max-md:origin-bottom max-md:scale-80"
        />
      </span>
      <Text
        variant="title-shelf"
        tone={locked ? "dim" : "primary"}
        className="relative mt-3.5 max-md:mt-2"
      >
        {title}
      </Text>
      <Text
        variant="mono-xs"
        tone={locked ? "dim" : "label"}
        leading="font"
        className="relative px-2 group-data-[state=active]/item:text-gold"
      >
        {shelfSub}
      </Text>
    </SelectableList.Item>
  );
}

/**
 * The glass cabinet: two shelves of trophies under their spotlights. One tab per trophy; the arrows move
 * along the shelves. It must sit inside a SelectableList.Root (the page owns the selection).
 */
export function Cabinet({ view, selected }: { view: TrophiesView; selected: string }) {
  return (
    <div className="relative flex flex-col overflow-hidden border border-line bg-linear-180 from-cabinet-hi to-cabinet-lo shadow-inset-cabinet">
      <CabinetGlass />
      {/* Shelf 1 is 310px tall; its light sits under it. */}
      <ShelfLight className="top-77 max-md:hidden" />
      <SelectableList.List
        label={view.listLabel}
        className="grid flex-1 grid-cols-3 gap-y-3 max-md:grid-cols-2 max-md:gap-y-0 min-[1200px]:grid-rows-[310px_1fr]"
      >
        {view.trophies.map((trophy, i) => (
          <Cell key={trophy.id} trophy={trophy} index={i} selected={trophy.id === selected} />
        ))}
      </SelectableList.List>
    </div>
  );
}
