import type { Meta, StoryObj } from "@storybook/react-vite";
import { ui } from "@/content";
import { GameLoader } from "./GameLoader";

const meta: Meta<typeof GameLoader> = {
  title: "Features/Games/Three",
  component: GameLoader,
  // A stand-in label: the game's own loading line comes with the scene.
  args: { label: ui.venues.cricket, progress: 0.35 },
};
export default meta;
type Story = StoryObj<typeof GameLoader>;

/** The stage's loader is as wide as the timing meter (640); the column's fills its width. */
export const Loader: Story = {
  render: (args) => (
    <div className="flex w-160 max-w-full flex-col gap-10 py-4">
      <GameLoader {...args} size="stage" />
      <GameLoader {...args} size="column" />
    </div>
  ),
};
