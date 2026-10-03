import type { Meta, StoryObj } from "@storybook/react-vite";
import { Glass } from "./Glass";
import { MonoLabel, Text } from "./Text";

const meta: Meta<typeof Glass> = { title: "Primitives/Glass", component: Glass };
export default meta;

const Body = ({ title }: { title: string }) => (
  <div className="flex flex-col gap-2">
    <MonoLabel>{title}</MonoLabel>
    <Text variant="body-sm" tone="secondary">
      Release when the marker hits the yorker zone.
    </Text>
  </div>
);

export const Surfaces: StoryObj<typeof Glass> = {
  render: () => (
    <div
      className="grid grid-cols-3 gap-6 bg-linear-180 from-venue-mid to-ground p-10"
      data-venue="turf"
    >
      <Glass pad="md">
        <Body title="GLASS" />
      </Glass>
      <Glass surface="solid" pad="md">
        <Body title="SOLID" />
      </Glass>
      <Glass surface="panel" pad="md">
        <Body title="PANEL" />
      </Glass>
      <Glass surface="gradient" pad="lg">
        <Body title="GRADIENT" />
      </Glass>
      <Glass surface="dashed" pad="sm">
        <Body title="DASHED · LOCKED" />
      </Glass>
      <Glass edge="volt" elevation="card" pad="md">
        <Body title="VOLT EDGE + CARD" />
      </Glass>
    </div>
  ),
};
