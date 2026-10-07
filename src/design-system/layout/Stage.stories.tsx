import type { Meta, StoryObj } from "@storybook/react-vite";
import { KeyboardHint } from "../broadcast/KeyboardHint";
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

/** L2: the mono floor. At 1440×900 (scale 1) the hint keeps its recipe size, 12px; on a smaller screen it grows in the design space so it renders at 11px or more. */
export const MonoFloor: StoryObj = {
  render: () => (
    <Stage>
      <KeyboardHint data-testid="floor-hint" className="absolute right-9 bottom-11.5">
        ENTER ↵ TO PLAY · Q FOR QUICK VIEW
      </KeyboardHint>
    </Stage>
  ),
};
