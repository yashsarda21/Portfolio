import type { Meta, StoryObj } from "@storybook/react-vite";
import { PanelHeader } from "./PanelHeader";

const meta: Meta<typeof PanelHeader> = { title: "Primitives/PanelHeader", component: PanelHeader };
export default meta;

const COLUMNS = "grid grid-cols-[56px_minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_110px] gap-4";

/** The bar over a list: a label (md, 44px) or column heads (lg, 48px); a hairline divider under it. Decorative. */
export const Sizes: StoryObj<typeof PanelHeader> = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="w-75 glass">
        <PanelHeader>THE DRAW</PanelHeader>
      </div>
      <div className="w-200 glass">
        <PanelHeader size="lg" variant="mono-round" className={COLUMNS}>
          <span>INN</span>
          <span>TEAM</span>
          <span>ROLE</span>
          <span>SPAN</span>
          <span className="text-right">STATUS</span>
        </PanelHeader>
      </div>
    </div>
  ),
};
