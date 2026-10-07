import type { Meta, StoryObj } from "@storybook/react-vite";
import { CommentaryBar } from "../broadcast/CommentaryBar";
import { Text } from "../primitives/Text";
import { DashedPanel } from "./DashedPanel";

const meta: Meta = { title: "Layout/Panels" };
export default meta;

/** Team Up's "AFTER YOU SEND" preview: a dashed box holding an inline commentary line and a note. */
export const DashedWithCommentary: StoryObj = {
  render: () => (
    <DashedPanel label="AFTER YOU SEND" className="w-136">
      <CommentaryBar tag="COMM" variant="inline" line="Challenge received. I'll serve first." />
      <Text variant="caption" tone="label">
        Floodlights pulse once, the crowd lifts, and the scoreboard reads{" "}
        <span className="font-mono text-floodlight">NEW FIXTURE · VISITOR vs YASH</span>.
      </Text>
    </DashedPanel>
  ),
};
