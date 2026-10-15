import type { Meta, StoryObj } from "@storybook/react-vite";
import { ui } from "@/content";
import { LinePicker as Picker } from "./LinePicker";
import { buildCricket3dControls } from "./view";

const meta: Meta = {
  title: "Features/Games/Cricket",
};
export default meta;

const { lines } = buildCricket3dControls(ui, { phase: "ready", aim: "middle", speedKmh: null });

/** The 3D game's line control with MIDDLE picked: the stage's (named, with its keys) and the column's (full width). */
export const LinePicker: StoryObj = {
  render: () => (
    <div className="flex w-110 max-w-full flex-col items-center gap-10 py-4">
      <Picker lines={lines} disabled={false} onLine={() => {}} size="stage" />
      <Picker lines={lines} disabled={false} onLine={() => {}} size="column" />
    </div>
  ),
};
