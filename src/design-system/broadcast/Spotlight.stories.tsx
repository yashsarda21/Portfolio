import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spotlight } from "./Spotlight";

const meta: Meta = { title: "Broadcast/Spotlight" };
export default meta;
type Story = StoryObj;

const KUDO = {
  kind: "unlock",
  eyebrow: "HIGHLIGHT 02 · SF",
  title: "KUDO BOARD",
  line: "Used by the whole team for the first month, then every sprint after.",
  to: "left",
} as const;

/** Yash's point on the stage (120px title), in the middle of a 720px-wide stage. */
export const UnlockStage: Story = {
  render: () => (
    <div className="flex w-180 justify-center py-6">
      <Spotlight spotlight={KUDO} size="stage" className="w-140" />
    </div>
  ),
};

/** The phone's column (64px title) at its 360px width. */
export const UnlockColumn: Story = {
  render: () => (
    <div className="w-90 py-6">
      <Spotlight spotlight={{ ...KUDO, to: "right" }} size="column" />
    </div>
  ),
};

/** The longest title wraps onto balanced lines in the 360px column. */
export const UnlockLongTitle: Story = {
  render: () => (
    <div className="w-90 py-6">
      <Spotlight
        spotlight={{
          kind: "unlock",
          eyebrow: "HIGHLIGHT 04 · AI",
          title: "AI INTERVIEW PLATFORM",
          line: "Cut a first-round screen from 45 minutes to 10.",
          to: "right",
        }}
        size="column"
      />
    </div>
  ),
};

/** The visitor's point: the words alone, on the stage and on the column. */
export const Yours: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <Spotlight spotlight={{ kind: "yours", text: "WELL PLAYED." }} size="stage" />
      <Spotlight spotlight={{ kind: "yours", text: "GOOD POINT." }} size="column" />
    </div>
  ),
};
