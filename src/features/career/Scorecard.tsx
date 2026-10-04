import { ui } from "@/content";
import { Glass, SelectableList, Text } from "@/design-system";
import { cn } from "@/lib/cn";
import { ArenaLink } from "@/shell/ArenaLink";
import type { CareerView } from "./view";

/** Number, team, role, span, status. Rows and the column header share it so the columns line up. */
const COLUMNS =
  "grid grid-cols-[56px_minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_110px] gap-4 px-5.5";
/** On the phone a row is a three-line card: number and status, team, then role and span. */
const CARD = "max-md:grid-cols-[1fr_auto] max-md:gap-x-3 max-md:gap-y-1 max-md:py-3.5";

const NUMBER = cn(
  "type-d3 leading-auto text-dim max-md:type-d3s",
  "max-md:row-start-1",
  "group-data-[state=active]/item:text-volt",
);
const TEAM = "type-d4s leading-auto max-md:col-span-2 max-md:row-start-2";
const ROLE_SPAN =
  "contents max-md:col-span-2 max-md:row-start-3 max-md:flex max-md:flex-wrap max-md:items-baseline max-md:gap-x-2";
const STATUS = "text-right type-mono-tag leading-auto max-md:col-start-2 max-md:row-start-1";

type Row = CareerView["rows"][number];

function RoleAndSpan({ role, span, sep }: { role: string; span: string; sep: string }) {
  return (
    <span className={ROLE_SPAN}>
      <Text variant="body-md" tone="secondary" className="leading-auto max-md:type-body-sm">
        {role}
      </Text>
      <span aria-hidden="true" className="text-dim md:hidden">
        {sep}
      </span>
      <Text variant="mono-stack" tone="secondary" className="uppercase">
        {span}
      </Text>
    </span>
  );
}

function InningsRow({ row, sep }: { row: Row; sep: string }) {
  return (
    <SelectableList.Item value={row.id} className={cn("min-h-21", COLUMNS, CARD)}>
      <span className={NUMBER}>{row.n}</span>
      <span className={TEAM}>{row.team}</span>
      <RoleAndSpan role={row.role} span={row.span} sep={sep} />
      <span className={cn(STATUS, row.current && "text-volt")}>{row.status}</span>
    </SelectableList.Item>
  );
}

/** The scorecard: column header, one selectable row per innings, the academy link, and the legend. */
export function Scorecard({ view }: { view: CareerView }) {
  const { cols, academy } = view;
  const sep = ui.glyph.sep;
  return (
    <Glass className="flex flex-col">
      {/* The tabs' own names say all of this; the header is a visual guide only. */}
      <div
        aria-hidden="true"
        className={cn(
          "box-content h-12 items-center border-b border-line type-mono-round text-scout max-md:hidden",
          COLUMNS,
        )}
      >
        <span>{cols.inn}</span>
        <span>{cols.team}</span>
        <span>{cols.role}</span>
        <span>{cols.span}</span>
        <span className="text-right">{cols.status}</span>
      </div>
      <SelectableList.List label={view.listLabel}>
        {view.rows.map((row) => (
          <InningsRow key={row.id} row={row} sep={sep} />
        ))}
      </SelectableList.List>
      {academy ? (
        <ArenaLink
          to={academy.to}
          className={cn(
            "group/item min-h-21 w-full items-center border-b border-l-3 border-line border-l-transparent text-floodlight transition-colors duration-(--dur-snap) hover:bg-white-a04 focus-visible:-outline-offset-2",
            COLUMNS,
            CARD,
          )}
        >
          <span className={NUMBER}>{academy.n}</span>
          <span className={TEAM}>{academy.team}</span>
          <RoleAndSpan role={academy.role} span={academy.span} sep={sep} />
          <span className={STATUS}>{academy.status}</span>
        </ArenaLink>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line px-5.5 py-4">
        <Text variant="mono-tag" tone="dim" className="leading-auto">
          {view.legend}
        </Text>
        <ArenaLink
          to={view.viewCard.to}
          className="type-mono-md leading-auto text-volt hover:text-volt-hover"
        >
          {view.viewCard.label} <span aria-hidden="true">{ui.glyph.next}</span>
        </ArenaLink>
      </div>
    </Glass>
  );
}
