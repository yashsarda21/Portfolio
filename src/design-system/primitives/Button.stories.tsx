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
      <Button size="form">Send challenge</Button>
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
    <div className="flex flex-wrap gap-6 p-6">
      <Button as="a" href="#scout" variant="secondary" iconRight="arrow-right">
        Quick view
      </Button>
      <Button as="a" aria-disabled="true" variant="secondary" iconRight="arrow-right">
        Coming soon
      </Button>
    </div>
  ),
};

/** Cards use `group` for their own hover styles; a button inside must not react to the card's hover. */
export const InsideHoverCard: Story = {
  render: () => (
    <div className="group w-120 border border-line p-6" data-testid="hover-card">
      <p className="mb-4 type-body text-text-2">Hovering this card must not light the button.</p>
      <Button variant="secondary" skew={false} size="s" data-testid="card-button">
        Secondary
      </Button>
    </div>
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

export const FluidPageVariants: Story = {
  render: () => (
    <div className="flex w-90 flex-col gap-4 bg-ground p-6">
      <Button size="cta" skew={false}>
        Team up
      </Button>
      <Button size="cta" skew={false} glow={false}>
        No glow
      </Button>
      <Button size="bar" variant="panel" skew={false}>
        Panel bar
      </Button>
      <Button size="bar" skew={false}>
        Primary bar
      </Button>
    </div>
  ),
};

/** Fluid-page sizes: `cta` (page hero) and `bar` (mobile bottom bar), filled and outlined. */
export const PageSizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-6 p-6">
      <div className="flex gap-3.5">
        <Button size="cta" skew={false} glow={false}>
          Primary CTA
        </Button>
        <Button size="cta" variant="outline" skew={false}>
          Outline CTA
        </Button>
      </div>
      <div className="grid w-97.5 grid-cols-2 gap-2.5">
        <Button size="bar" variant="panel" skew={false}>
          Player card
        </Button>
        <Button size="bar" skew={false} glow={false}>
          Team up
        </Button>
      </div>
    </div>
  ),
};
