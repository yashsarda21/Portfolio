import type { Meta, StoryObj } from "@storybook/react-vite";
import { withShell } from "@/shell/storyDecorators";
import { artboardHighlightsView } from "./HighlightsPage.fixture";
import { HighlightsPage, HighlightsScreen } from "./HighlightsPage";

const meta: Meta = {
  title: "Features/Highlights",
  parameters: { layout: "fullscreen" },
  decorators: [withShell],
};
export default meta;

/** The real page, built from content. */
export const RealContent: StoryObj = { render: () => <HighlightsScreen /> };

/** The artboard's own copy (with its LIVE DEMO and FULL CASE STUDY rows), compared pixel-for-pixel with Tennis-Highlights. */
export const ArtboardParity: StoryObj = {
  render: () => <HighlightsPage view={artboardHighlightsView} />,
};

/** Six more rounds than the page has today: the draw scrolls inside its panel instead of stretching the page. */
export const LongDraw: StoryObj = {
  render: () => {
    const { items } = artboardHighlightsView;
    const more = Array.from({ length: 6 }, (_, i) => ({
      ...items[0]!,
      id: `extra-${i}`,
      name: `EXTRA PROJECT ${i + 1}`,
    }));
    return <HighlightsPage view={{ ...artboardHighlightsView, items: [...more, ...items] }} />;
  },
};
