import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "./IconButton";

const meta: Meta<typeof IconButton> = { title: "Primitives/IconButton", component: IconButton };
export default meta;
type Story = StoryObj<typeof IconButton>;

export const Glass: Story = { args: { icon: "speaker", label: "Toggle crowd audio" } };
export const Outline: Story = { args: { icon: "copy", label: "Copy link", variant: "outline" } };
export const PressedToggle: Story = {
  args: { icon: "speaker-loud", label: "Crowd audio", pressed: true },
};
