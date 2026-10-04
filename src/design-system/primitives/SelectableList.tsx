import * as Tabs from "@radix-ui/react-tabs";
import { createContext, useContext } from "react";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

/** The selected value, so a panel can set `hidden` itself (Radix drops it when a panel is force-mounted). */
const SelectedValue = createContext<string | null>(null);

type RootProps = Omit<ComponentPropsWithRef<typeof Tabs.Root>, "defaultValue" | "value"> & {
  value: string;
  onValueChange: (value: string) => void;
};

/** Controlled tab group. Vertical by default: ↑/↓ move the selection, Home/End jump. */
function Root({ value, orientation = "vertical", ...rest }: RootProps) {
  return (
    <SelectedValue.Provider value={value}>
      <Tabs.Root value={value} orientation={orientation} {...rest} />
    </SelectedValue.Provider>
  );
}

type ListProps = Omit<ComponentPropsWithRef<typeof Tabs.List>, "aria-label"> & {
  /** Accessible name of the tablist. */
  label: string;
};

function List({ label, ...rest }: ListProps) {
  return <Tabs.List aria-label={label} {...rest} />;
}

/**
 * One selectable row. Style its state with `data-[state=active]:`; parts inside it follow with
 * `group-data-[state=active]/item:`.
 */
function Item({ className, ...rest }: ComponentPropsWithRef<typeof Tabs.Trigger>) {
  return (
    <Tabs.Trigger
      className={cn(
        "group/item flex min-h-11 w-full cursor-pointer items-center border-b border-l-3 border-line border-l-transparent bg-transparent text-left text-floodlight transition-colors duration-(--dur-snap) hover:bg-white-a04 focus-visible:-outline-offset-2 data-[state=active]:border-l-volt data-[state=active]:bg-volt-a06 data-[state=active]:hover:bg-white-a04",
        className,
      )}
      {...rest}
    />
  );
}

/** Detail pane for one item. Every panel stays in the HTML; the inactive ones are `hidden`. */
function Panel({ value, ...rest }: ComponentPropsWithRef<typeof Tabs.Content>) {
  const selected = useContext(SelectedValue);
  return <Tabs.Content value={value} forceMount hidden={selected !== value} {...rest} />;
}

export const SelectableList = { Root, List, Item, Panel };
