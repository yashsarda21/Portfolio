import type { Meta, StoryObj } from "@storybook/react-vite";
import { withShell } from "@/shell/storyDecorators";
import { artboardTrophiesView } from "./TrophiesPage.fixture";
import { TrophiesPage, TrophiesScreen } from "./TrophiesPage";

const meta: Meta = {
  title: "Features/Trophies",
  parameters: { layout: "fullscreen" },
  decorators: [withShell],
};
export default meta;

/** The real page, built from content (with the way on to the player card). */
export const RealContent: StoryObj = { render: () => <TrophiesScreen /> };

/** The artboard's own copy, drawn without the player card button (as the artboard is), compared pixel-for-pixel with Trophy-Room. */
export const ArtboardParity: StoryObj = {
  render: () => <TrophiesPage view={artboardTrophiesView} withNext={false} />,
};
