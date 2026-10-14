import type { Meta, StoryObj } from "@storybook/react-vite";
import { withShell } from "@/shell/storyDecorators";
import { NotFoundScreen } from "./NotFoundPage";

const meta: Meta = {
  title: "Features/NotFound",
  parameters: { layout: "fullscreen" },
  decorators: [withShell],
};
export default meta;

/** An unknown address: the page names the path that was tried. */
export const Tried: StoryObj = { render: () => <NotFoundScreen path="/arena/nope/deeper" /> };

/** `/404` itself: nothing was tried, so there is no line. */
export const Plain: StoryObj = { render: () => <NotFoundScreen /> };

/** A very long address is cut at 60 characters. */
export const LongPath: StoryObj = {
  render: () => <NotFoundScreen path={`/${"very-long-segment/".repeat(8)}end`} />,
};
