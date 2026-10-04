import type { Meta, StoryObj } from "@storybook/react-vite";
import { Chip, ChipList } from "./Chip";

const meta: Meta<typeof Chip> = { title: "Primitives/Chip", component: Chip };
export default meta;

export const Tones: StoryObj<typeof Chip> = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Chip>Java</Chip>
      <Chip tone="strong">System Design</Chip>
      <Chip tone="meta" size="lg">
        SOFTWARE ENGINEER 1 · SINCE JUL 2024
      </Chip>
      <Chip tone="volt">React</Chip>
      <Chip tone="volt-outline">Pune, India</Chip>
    </div>
  ),
};

export const StackList: StoryObj<typeof Chip> = {
  render: () => (
    <ChipList
      label="Stack"
      size="sm"
      items={["React", "Spring Boot", "Oracle", "JUnit", "TeamCity"]}
    />
  ),
};

/** `text="name"`: a tool name as written (mixed case, untracked), in the two content-box sizes the artboards draw. */
export const ToolNames: StoryObj<typeof Chip> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ChipList
        label="Stack, medium"
        size="md"
        text="name"
        items={["Spring Boot", "Node.js", "uDeploy"]}
      />
      <ChipList
        label="Stack, small"
        size="sm"
        text="name"
        items={["Spring Boot", "Node.js", "uDeploy"]}
      />
    </div>
  ),
};

/** A visible `heading` names the list; assistive tech hears it once. */
export const HeadedList: StoryObj<typeof Chip> = {
  render: () => (
    <div className="flex w-90 flex-col gap-6">
      <ChipList
        heading="SHOTS PLAYED"
        size="md"
        text="name"
        items={["Java", "Spring Boot", "React", "Oracle"]}
      />
      <ChipList heading="STACK" size="sm" text="name" items={["React", "Node.js", "Firebase"]} />
    </div>
  ),
};

export const FluidSizes: StoryObj<typeof Chip> = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Chip tone="meta" size="meta">
        PUNE, INDIA
      </Chip>
      <Chip tone="strong" size="code">
        Spring Boot
      </Chip>
    </div>
  ),
};
