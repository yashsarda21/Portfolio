import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta: Meta<typeof Button> = { title: "Primitives/Button", component: Button };
export default meta;
type Story = StoryObj<typeof Button>;

export const Playground: Story = {
  args: { children: "Bowl · Space", variant: "primary", size: "m" },
};

export const HeroPair: Story = {
  render: () => (
    <div className="flex flex-col gap-5.5 p-6 md:flex-row">
      <Button size="xl" subLabel="INTERACTIVE · ~3 MIN" data-testid="cta-primary">
        Enter the arena
      </Button>
      <Button size="xl" variant="secondary" subLabel="RECRUITER VIEW · 90 SEC">
        View portfolio
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-6 p-6">
      <Button size="s">Next venue</Button>
      <Button size="m">See the full scorecard</Button>
      <Button size="l" pulse data-testid="cta-pulse">
        Enter the arena →
      </Button>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6 p-6">
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline" skew={false}>
        Outline
      </Button>
      <Button variant="ghost" skew={false} iconRight="arrow-right">
        Ghost
      </Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};

export const AsLink: Story = {
  render: () => (
    <Button as="a" href="#scout" variant="secondary" iconRight="arrow-right">
      Quick view
    </Button>
  ),
};

export const Flat: Story = {
  render: () => (
    <div className="flex w-90 gap-2.5">
      <Button skew={false} size="s" className="flex-1">
        Play
      </Button>
      <Button skew={false} size="s" variant="outline">
        Skip →
      </Button>
    </div>
  ),
};
