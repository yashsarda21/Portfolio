import type { Meta, StoryObj } from "@storybook/react-vite";
import { withShell } from "@/shell/storyDecorators";
import { artboardCareerView } from "./CareerPage.fixture";
import { CareerPage, CareerScreen } from "./CareerPage";

const meta: Meta = {
  title: "Features/Career",
  parameters: { layout: "fullscreen" },
  decorators: [withShell],
};
export default meta;

/** The real page, built from content (with the academy row). */
export const RealContent: StoryObj = { render: () => <CareerScreen /> };

/** The artboard's own copy, compared pixel-for-pixel with Cricket-Career. */
export const ArtboardParity: StoryObj = {
  render: () => <CareerPage view={artboardCareerView} />,
};
