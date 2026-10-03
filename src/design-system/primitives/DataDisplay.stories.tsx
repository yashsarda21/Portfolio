import type { Meta, StoryObj } from "@storybook/react-vite";
import { Glass } from "./Glass";
import { KeyValueList } from "./KeyValueList";
import { Legend } from "./Legend";
import { ProgressSteps } from "./ProgressSteps";

const meta: Meta = { title: "Primitives/Data display" };
export default meta;

export const KeyValues: StoryObj = {
  render: () => (
    <div className="grid w-200 grid-cols-2 gap-8">
      <KeyValueList
        items={[
          { k: "Home ground", v: "Pune, India" },
          { k: "Pro debut", v: "Jun 2023" },
          { k: "Current club", v: "Deutsche Bank", accent: true },
        ]}
      />
      <KeyValueList
        variant="stacked"
        items={[
          { k: "TYPE", v: "Analytics web platform" },
          { k: "KEY PIECE", v: "Secure token generation" },
        ]}
      />
    </div>
  ),
};

export const LegendRow: StoryObj = {
  render: () => (
    <Legend
      items={[
        { label: "SHIPPED AT DEUTSCHE BANK", swatch: "volt" },
        { label: "BUILT IN PROJECTS", swatch: "floodlight" },
        { label: "IN THE KIT BAG", swatch: "dim" },
      ]}
    />
  ),
};

export const Progress: StoryObj = {
  render: () => (
    <Glass pad="md" className="flex w-60 flex-col gap-6">
      <ProgressSteps total={3} done={1} label="1 of 3 venues played" />
      <ProgressSteps total={3} done={2} current variant="segment" label="Rally 3 of 3" />
    </Glass>
  ),
};
