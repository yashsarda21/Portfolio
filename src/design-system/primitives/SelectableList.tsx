import * as Tabs from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
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
 * The look of one item. row: a hairline-divided line with a 3px left edge that turns volt when selected.
 * bare: no row chrome, only the focus ring, for a cell that draws its own selected state (a shelf of trophies).
 */
const selectableItemVariants = cva("group/item cursor-pointer text-floodlight", {
  variants: {
    variant: {
      row: "flex min-h-11 w-full items-center border-b border-l-3 border-line border-l-transparent bg-transparent text-left transition-colors duration-(--dur-snap) hover:bg-white-a04 focus-visible:-outline-offset-2 data-[state=active]:border-l-volt data-[state=active]:bg-volt-a06 data-[state=active]:hover:bg-white-a04",
      bare: "border-0 bg-transparent p-0 focus-visible:-outline-offset-4 disabled:cursor-default",
    },
  },
  defaultVariants: { variant: "row" },
});

type ItemProps = ComponentPropsWithRef<typeof Tabs.Trigger> &
  VariantProps<typeof selectableItemVariants>;

/**
 * One selectable item. Style its state with `data-[state=active]:`; parts inside it follow with
 * `group-data-[state=active]/item:`. A `disabled` item is announced but cannot be selected, and the arrow keys
 * skip it. It has no panel, so it points at none (Radix would name one that is never drawn).
 */
function Item({ variant, className, disabled, ...rest }: ItemProps) {
  return (
    <Tabs.Trigger
      disabled={disabled}
      className={cn(selectableItemVariants({ variant }), className)}
      {...(disabled ? { "aria-controls": undefined } : {})}
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
