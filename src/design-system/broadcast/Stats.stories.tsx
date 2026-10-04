import type { Meta, StoryObj } from "@storybook/react-vite";
import { Glass } from "../primitives/Glass";
import { SkillGroup } from "./SkillGroup";
import { SkillRow } from "./SkillRow";
import { StatTile } from "./StatTile";

const meta: Meta = { title: "Broadcast/Stats" };
export default meta;

export const Tiles: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex gap-0.5">
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

/** The tiles in a page title's right slot: side by side at any width, filling the row on the phone. */
export const TileRow: StoryObj = {
  render: () => (
    <div className="flex items-stretch gap-0.5 max-md:w-full">
      <StatTile label="PRO SINCE" value="JUL 2024" />
      <StatTile label="CLUB" value="DEUTSCHE" />
      <StatTile label="CURRENT" value="NOT OUT" tone="volt" />
    </div>
  ),
};

export const Skills: StoryObj = {
  render: () => (
    <Glass pad="md" className="flex w-128.5 flex-col gap-3 px-5.5">
      <SkillRow name="Java" level="shipped" tierLabel="SHIPPED" animate />
      <SkillRow name="JUnit" level="shipped" tierLabel="75+ TESTS" animate />
      <SkillRow name="JavaScript" level="built" tierLabel="BUILT" animate />
      <SkillRow name="Apache Kafka" level="kit" tierLabel="KIT BAG" animate />
    </Glass>
  ),
};

const GROUP_SKILLS = [
  { name: "Java", level: "shipped", tierLabel: "SHIPPED" },
  { name: "JUnit", level: "shipped", tierLabel: "75+ TESTS" },
  { name: "JavaScript", level: "built", tierLabel: "BUILT" },
  { name: "Apache Kafka", level: "kit", tierLabel: "KIT BAG" },
] as const;

/** A skill group at the desktop column width (three columns per row) and at a phone's (the bar drops under the name). */
export const Group: StoryObj = {
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      <SkillGroup
        className="w-128.5"
        name="BACKEND"
        shotLine="SHOT · SMASH"
        note="Power and pace — where most of my points are won."
        skills={GROUP_SKILLS}
        animate
      />
      <SkillGroup
        className="w-82"
        name="BACKEND"
        shotLine="SHOT · SMASH"
        note="Power and pace — where most of my points are won."
        skills={GROUP_SKILLS}
      />
    </div>
  ),
};
