import type { Meta, StoryObj } from "@storybook/react-vite";
import { Glass } from "../primitives/Glass";
import { SkillRow } from "./SkillRow";
import { StatTile } from "./StatTile";

const meta: Meta = { title: "Broadcast/Stats" };
export default meta;

export const Tiles: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3">
        <StatTile label="PRO SINCE" value="JUL 2024" />
        <StatTile label="PROBLEMS" value="750+" countUp />
        <StatTile label="CURRENT" value="NOT OUT" tone="volt" />
      </div>
      <div className="grid w-100 grid-cols-3 gap-px bg-line">
        <StatTile tone="cell" label="CGPA" value="8.94" />
        <StatTile tone="cell" label="CET %ILE" value="99.5" />
        <StatTile tone="cell" label="RECORDS" value="10K+" />
      </div>
    </div>
  ),
};

export const Skills: StoryObj = {
  render: () => (
    <Glass pad="md" className="flex w-130 flex-col gap-3">
      <SkillRow name="Java" level="shipped" tierLabel="SHIPPED" animate />
      <SkillRow name="JUnit" level="shipped" tierLabel="75+ TESTS" animate />
      <SkillRow name="JavaScript" level="built" tierLabel="BUILT" animate />
      <SkillRow name="Apache Kafka" level="kit" tierLabel="KIT BAG" animate />
    </Glass>
  ),
};
