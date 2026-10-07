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
    </div>
  ),
};

/** The Player Card's stat cells at the card's inner width (352px): label left, value right, the first three volt. */
export const CellGrid: StoryObj = {
  render: () => (
    <div className="grid w-88 grid-cols-3 gap-px border border-line bg-line">
      <StatTile tone="cell" accent label="PROBLEMS" value="750+" />
      <StatTile tone="cell" accent label="CGPA" value="8.94" />
      <StatTile tone="cell" accent label="CET %ILE" value="99.5" />
      <StatTile tone="cell" label="LISTS" value="200+" />
      <StatTile tone="cell" label="RECORDS" value="10K+" />
      <StatTile tone="cell" label="TESTS" value="75+" />
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

/**
 * Two groups side by side whose notes wrap differently. From 768 to 1199px (narrow the viewport) `alignRows`
 * keeps their skill bars level; at other widths it is the plain stack.
 */
export const GroupsAligned: StoryObj = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <SkillGroup
        name="BACKEND"
        shotLine="SHOT · SMASH"
        note="Power and pace."
        skills={GROUP_SKILLS}
        alignRows
      />
      <SkillGroup
        name="DATA"
        shotLine="SHOT · DROP"
        note="A much longer note that wraps onto a second line at a tablet width, to show the bars still line up."
        skills={GROUP_SKILLS}
        alignRows
      />
    </div>
  ),
};
