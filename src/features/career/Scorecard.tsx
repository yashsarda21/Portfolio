import { ui } from "@/content";
import { Glass, PanelHeader, SelectableList, Text } from "@/design-system";
import { cn } from "@/lib/cn";
import { ArenaLink } from "@/shell/ArenaLink";
import type { CareerView } from "./view";

/** Number, team, role, span, status. Rows and the column header share it so the columns line up. */
const COLUMNS =
  "grid grid-cols-[56px_minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_110px] gap-4 px-5.5";
/** Below 1024px a row is a three-line card: number and status, team, then role and span. */
const CARD = "max-lg:grid-cols-[1fr_auto] max-lg:gap-x-3 max-lg:gap-y-1 max-lg:py-3.5";
const ROW = cn("min-h-21", COLUMNS, CARD);

const ROLE_SPAN =
  "contents max-lg:col-span-2 max-lg:row-start-3 max-lg:flex max-lg:flex-wrap max-lg:items-baseline max-lg:gap-x-2";

type Row = CareerView["rows"][number];
/** What every row shows: the innings rows, and the academy link after them. */
type Cells = Pick<Row, "n" | "team" | "role" | "span" | "status"> & { current?: boolean };

/** The five cells of a row. The row itself is a tab (InningsRow) or a link (the academy). */
function RowCells({ cells, sep }: { cells: Cells; sep: string }) {
  return (
    <>
      <Text
        variant="d3"
        tone="dim"
        leading="font"
        className="group-data-[state=active]/item:text-volt max-lg:row-start-1"
      >
        {cells.n}
      </Text>
      <Text variant="d4s" leading="font" className="max-lg:col-span-2 max-lg:row-start-2">
        {cells.team}
      </Text>
      <span className={ROLE_SPAN}>
        <Text variant="body-md" tone="secondary" leading="font">
          {cells.role}
        </Text>
        <span aria-hidden="true" className="text-dim lg:hidden">
          {sep}
        </span>
        <Text variant="mono-stack" tone="secondary" caps>
          {cells.span}
        </Text>
      </span>
      <Text
        variant="mono-tag"
        tone={cells.current ? "volt" : undefined}
        leading="font"
        className="text-right max-lg:col-start-2 max-lg:row-start-1"
      >
        {cells.status}
      </Text>
    </>
  );
}

/** The scorecard: column header, one selectable row per innings, the academy link, and the legend. */
export function Scorecard({ view }: { view: CareerView }) {
  const { cols, academy } = view;
  const sep = ui.glyph.sep;
  return (
    <Glass className="flex flex-col">
      {/* The tabs' own names say all of this; the header is a visual guide only. */}
      <PanelHeader size="lg" variant="mono-round" className={cn(COLUMNS, "max-lg:hidden")}>
        <span>{cols.inn}</span>
        <span>{cols.team}</span>
        <span>{cols.role}</span>
        <span>{cols.span}</span>
        <span className="text-right">{cols.status}</span>
      </PanelHeader>
      <SelectableList.List label={view.listLabel}>
        {view.rows.map((row) => (
          <SelectableList.Item key={row.id} value={row.id} className={ROW}>
            <RowCells cells={row} sep={sep} />
          </SelectableList.Item>
        ))}
      </SelectableList.List>
      {academy ? (
        <SelectableList.LinkRow as={ArenaLink} to={academy.to} className={ROW}>
          <RowCells cells={academy} sep={sep} />
        </SelectableList.LinkRow>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line px-5.5 py-4">
        <Text variant="mono-tag" tone="dim" leading="font">
          {view.legend}
        </Text>
        <Text
          as={ArenaLink}
          to={view.viewCard.to}
          variant="mono-md"
          tone="volt"
          leading="font"
          className="hover:text-volt-hover"
        >
          {view.viewCard.label} <span aria-hidden="true">{ui.glyph.next}</span>
        </Text>
      </div>
    </Glass>
  );
}
