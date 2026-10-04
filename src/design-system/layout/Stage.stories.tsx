import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArenaBackdrop } from "../scene/ArenaBackdrop";
import { Heading } from "../primitives/Text";
import { Stage } from "./Stage";

const meta: Meta = { title: "Layout/Stage", parameters: { layout: "fullscreen" } };
export default meta;

export const LandingStage: StoryObj = {
  render: () => (
    <Stage backdrop={<ArenaBackdrop bleed />}>
      <Heading level={1} className="absolute top-90 left-0 w-full text-center">
        STAGE 1440 × 900
      </Heading>
    </Stage>
  ),
};
