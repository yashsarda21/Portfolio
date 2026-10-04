import type { Meta, StoryObj } from "@storybook/react-vite";
import { withShell } from "@/shell/storyDecorators";
import { artboardAttributesView } from "./AttributesPage.fixture";
import { AttributesPage, AttributesScreen } from "./AttributesPage";

const meta: Meta = {
  title: "Features/Attributes",
  parameters: { layout: "fullscreen" },
  decorators: [withShell],
};
export default meta;

/** The real page, built from content. */
export const RealContent: StoryObj = { render: () => <AttributesScreen /> };

/** The artboard's own copy, compared pixel-for-pixel with Badminton-Attributes. */
export const ArtboardParity: StoryObj = {
  render: () => <AttributesPage view={artboardAttributesView} />,
};
