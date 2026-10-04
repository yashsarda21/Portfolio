import { Fragment } from "react";
import { cn } from "@/lib/cn";
import { CabinetGlass, SelectableList, ShelfLight, Spotlight, Text, Trophy } from "@/design-system";
import type { TrophiesView, TrophyView } from "./view";

/** Three trophies to a shelf; on the phone, two. */
const PER_SHELF = 3;
const PER_SHELF_PHONE = 2;

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
          scale="phone"
        />
      )}
      <Trophy kind={kind} label={label} spinning={selected && !locked} scale="phone" />
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
        className="relative px-2 text-balance group-data-[state=active]/item:text-gold"
      >
        {shelfSub}
      </Text>
    </SelectableList.Item>
  );
}

/**
 * The glass cabinet: shelves of trophies under their spotlights, a light bar between the shelves. One tab per
 * trophy; the arrows move along the shelves. It must sit inside a SelectableList.Root (the page owns the selection).
 */
export function Cabinet({ view, selected }: { view: TrophiesView; selected: string }) {
  const count = view.trophies.length;
  return (
    <div className="relative flex flex-col overflow-hidden border border-line bg-linear-180 from-cabinet-hi to-cabinet-lo shadow-inset-cabinet">
      <CabinetGlass />
      <SelectableList.List
        label={view.listLabel}
        className="grid flex-1 grid-cols-3 max-md:grid-cols-2 min-[1200px]:grid-rows-[310px_auto_1fr]"
      >
        {view.trophies.map((trophy, i) => {
          const done = i + 1;
          return (
            // A light bar after each shelf but the last: after 3 trophies, or after 2 on the phone.
            <Fragment key={trophy.id}>
              <Cell trophy={trophy} index={i} selected={trophy.id === selected} />
              {done < count && done % PER_SHELF === 0 ? (
                <ShelfLight placement="row" className="max-md:hidden" />
              ) : null}
              {done < count && done % PER_SHELF_PHONE === 0 ? (
                <ShelfLight placement="row" className="md:hidden" />
              ) : null}
            </Fragment>
          );
        })}
      </SelectableList.List>
    </div>
  );
}
