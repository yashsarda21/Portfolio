import { Fragment } from "react";
import { cn } from "@/lib/cn";
import {
  CabinetGlass,
  SelectableList,
  FloorSpotlight,
  ShelfLight,
  Text,
  Trophy,
} from "@/design-system";
import type { TrophiesView, TrophyView } from "./view";

/** Three trophies to a shelf; on the phone, two. A short last shelf is centred. */
const PER_SHELF = 3;
const PER_SHELF_PHONE = 2;

/**
 * Where a trophy starts on the six-column desktop grid (every cell spans two) or the four-column phone grid
 * (every cell spans two): a short last shelf is centred under the full ones. Literal classes, so Tailwind sees them.
 */
function centring(index: number, count: number): string {
  const last = count - 1;
  const onDesktop =
    count % PER_SHELF === 2 && index === last - 1
      ? "md:col-start-2"
      : count % PER_SHELF === 1 && index === last
        ? "md:col-start-3"
        : "";
  const onPhone = count % PER_SHELF_PHONE === 1 && index === last ? "max-md:col-start-2" : "";
  return cn(onDesktop, onPhone);
}

/** One trophy on its shelf: the light, the art on its plinth, the name. It is a tab. */
function Cell({
  trophy,
  index,
  count,
  selected,
}: {
  trophy: TrophyView;
  index: number;
  count: number;
  selected: boolean;
}) {
  const { id, kind, title, shelfSub, label } = trophy;
  const topShelf = index < PER_SHELF;
  return (
    <SelectableList.Item
      value={id}
      variant="bare"
      className={cn(
        "relative col-span-2 flex flex-col items-center text-center transition-transform duration-400 ease-follow hover:-translate-y-1.5 md:justify-end",
        // Tablet keeps the shelf heights the cabinet is drawn with (a 300px and a 260px light); the desktop grid sets its own.
        topShelf ? "pb-4 md:max-[1199px]:min-h-77.5" : "pb-5 md:max-[1199px]:min-h-65",
        centring(index, count),
      )}
    >
      <FloorSpotlight
        index={index}
        size={topShelf ? "lg" : "md"}
        intensity={selected ? "lead" : "support"}
        scale="phone"
      />
      <Trophy kind={kind} label={label} spinning={selected} scale="phone" />
      <Text variant="title-shelf" tone="primary" className="relative mt-3.5 max-md:mt-2">
        {title}
      </Text>
      <Text
        variant="mono-xs"
        tone="label"
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
        className="grid flex-1 grid-cols-6 max-md:grid-cols-4 min-[1200px]:grid-rows-[310px_auto_1fr]"
      >
        {view.trophies.map((trophy, i) => {
          const done = i + 1;
          return (
            // A light bar after each shelf but the last: after 3 trophies, or after 2 on the phone.
            <Fragment key={trophy.id}>
              <Cell trophy={trophy} index={i} count={count} selected={trophy.id === selected} />
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
