import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, MonoLabel, Text } from "./Text";

const meta: Meta<typeof Text> = { title: "Primitives/Text", component: Text };
export default meta;
type Story = StoryObj<typeof Text>;

export const Playground: Story = {
  args: { children: "Think you can beat me?", variant: "challenge", tone: "body" },
};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Text tone="primary">primary — floodlight</Text>
      <Text tone="led">led — scoreboard white</Text>
      <Text tone="body">body — text-1</Text>
      <Text tone="secondary">secondary — text-2</Text>
      <Text tone="label">label — scout grey</Text>
      <Text tone="dim">dim — dimmest allowed text</Text>
      <Text tone="volt">volt — act here / you earned this</Text>
      <div className="bg-volt p-3">
        <Text tone="ink">ink — text on volt</Text> <Text tone="ink-2">ink-2</Text>
      </div>
      <div data-zone="trophy">
        <Text tone="gold">gold — trophy zone only</Text>
      </div>
    </div>
  ),
};

export const Headings: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Heading level={1}>Career stats</Heading>
      <Heading level={2}>Welcome to my arena</Heading>
      <Heading level={3}>Deutsche Bank</Heading>
      <Heading level={4}>Kudo Board</Heading>
      <Heading level={5}>Trophy room</Heading>
    </div>
  ),
};

export const MonoLabels: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <MonoLabel>BOWL AT ME</MonoLabel>
      <MonoLabel variant="mono-eyebrow" tone="volt">
        CONTACT
      </MonoLabel>
      <MonoLabel variant="mono-brand">THE ARENA</MonoLabel>
      <MonoLabel variant="mono-tag" tone="dim">
        INNINGS 02 · LOCKED
      </MonoLabel>
      <MonoLabel variant="mono-md" tone="primary">
        QUICK VIEW
      </MonoLabel>
      <MonoLabel variant="mono-kicker" tone="volt">
        90-SECOND READ
      </MonoLabel>
      <MonoLabel variant="mono-meta">EXPERIENCE · MOST RECENT FIRST</MonoLabel>
      <MonoLabel variant="mono-date">JUL 2024 – NOW · NOT OUT</MonoLabel>
      <MonoLabel variant="mono-chip">PUNE, INDIA</MonoLabel>
      <MonoLabel variant="mono-round">THE FINAL</MonoLabel>
      <Text variant="mono-stack" tone="label">
        React · Spring Boot · Java
      </Text>
    </div>
  ),
};
