import { Glass, SelectableList, Text } from "@/design-system";
import type { HighlightsView } from "./view";

/**
 * The tournament draw: one selectable row per project. From 1200px up the rows scroll inside the panel
 * (so a longer draw never stretches the page); below that the draw is as tall as its rows.
 */
export function Draw({ view }: { view: HighlightsView }) {
  return (
    <Glass className="flex min-w-0 flex-col">
      {/* The tablist's own name says this; the header is a visual title (box-content: 44px plus its divider). */}
      <Text
        aria-hidden="true"
        variant="mono-label"
        tone="label"
        className="box-content flex h-11 items-center border-b border-line px-4.5 leading-auto"
      >
        {view.drawLabel}
      </Text>
      <div className="relative min-h-0 flex-1">
        <div className="min-[1200px]:absolute min-[1200px]:inset-0 min-[1200px]:overflow-y-auto">
          <SelectableList.List label={view.listLabel}>
            {view.items.map((item) => (
              <SelectableList.Item
                key={item.id}
                value={item.id}
                className="min-h-24 flex-col items-start gap-1 px-4.5 py-3.5"
              >
                <span className="type-mono-round text-dim group-data-[state=active]/item:text-volt">
                  {item.round}
                </span>
                <span className="type-draw-name">{item.name}</span>
                <span className="type-body-kind text-scout">{item.kind}</span>
              </SelectableList.Item>
            ))}
          </SelectableList.List>
        </div>
      </div>
    </Glass>
  );
}
