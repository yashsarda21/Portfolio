import type { Meta, StoryObj } from "@storybook/react-vite";
import { withShell } from "@/shell/storyDecorators";
import { artboardReport } from "./QuickView.fixture";
import { QuickView, QuickViewScreen } from "./QuickView";

const meta: Meta = {
  title: "Features/Quick View",
  parameters: { layout: "fullscreen" },
  decorators: [withShell],
};
export default meta;

/** The real page, built from content. */
export const RealContent: StoryObj = { render: () => <QuickViewScreen /> };

/** The artboard's own copy, compared pixel-for-pixel with QuickView and Mobile-QuickView. */
export const ArtboardParity: StoryObj = { render: () => <QuickView report={artboardReport} /> };
