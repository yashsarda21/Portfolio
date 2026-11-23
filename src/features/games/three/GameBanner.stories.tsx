import type { Meta, StoryObj } from "@storybook/react-vite";
import { ui } from "@/content";
import { GameBanner } from "./GameBanner";

const meta: Meta<typeof GameBanner> = {
  title: "Features/Games/Three",
  component: GameBanner,
  args: {
    copy: ui.games.cricket.banner,
    label: ui.games.cricket.loading,
    progress: 0.35,
  },
};
export default meta;
type Story = StoryObj<typeof GameBanner>;

/** The stage's banner is 640 wide; the column's fills its width. */
export const Banner: Story = {
  render: (args) => (
    <div className="flex w-160 max-w-full flex-col gap-10 py-4">
      <GameBanner {...args} size="stage" />
      <GameBanner {...args} size="column" />
    </div>
  ),
};
