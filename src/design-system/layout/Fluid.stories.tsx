import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../primitives/Button";
import { LinkRow } from "../primitives/LinkRow";
import { AutoGrid } from "./AutoGrid";
import { FluidContainer } from "./FluidContainer";
import { FluidSection } from "./FluidSection";
import { HorizontalScroller } from "./HorizontalScroller";
import { SectionHeader } from "./SectionHeader";
import { StickyBottomActions } from "./StickyBottomActions";

const meta: Meta = { title: "Layout/Fluid" };
export default meta;

export const SectionHeaders: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-10 p-6">
      <SectionHeader title="Career" meta="2024 — NOW" id="career-demo" />
      <SectionHeader title="Skills" size="md" level={3} />
    </div>
  ),
};

export const LinkRows: StoryObj = {
  render: () => (
    <div className="bg-volt p-10">
      <LinkRow href="mailto:hello@example.com" glyph="→">
        Email me
      </LinkRow>
      <LinkRow href="#linkedin" glyph="↗">
        LinkedIn
      </LinkRow>
      <LinkRow href="#github" glyph="↗">
        GitHub
      </LinkRow>
    </div>
  ),
};

export const Scroller: StoryObj = {
  render: () => (
    <div className="w-97.5 p-4">
      <HorizontalScroller label="Projects">
        {["One", "Two", "Three"].map((name) => (
          <li key={name} className="shrink-0 snap-start">
            <div className="flex h-32 w-62.5 items-center justify-center border border-line-3 bg-panel type-title-sm">
              {name}
            </div>
          </li>
        ))}
      </HorizontalScroller>
    </div>
  ),
};

export const StickyActions: StoryObj = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="h-48 bg-ground">
      <StickyBottomActions label="Quick actions">
        <Button size="bar" variant="panel" skew={false}>
          Portfolio
        </Button>
        <Button size="bar" skew={false}>
          Team up
        </Button>
      </StickyBottomActions>
    </div>
  ),
};

const Cell = ({ children }: { children: string }) => (
  <div className="flex h-24 items-center justify-center border border-line-3 bg-panel type-title-sm">
    {children}
  </div>
);

/** One story per column width; each reflows by itself as the container narrows. */
export const AutoGrids: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-10 p-6">
      {([250, 300, 360, 380] as const).map((min) => (
        <AutoGrid key={min} min={min} className="gap-4">
          <Cell>{`${min}+`}</Cell>
          <Cell>Two</Cell>
          <Cell>Three</Cell>
        </AutoGrid>
      ))}
      <AutoGrid as="ul" min={300} from="md" className="gap-4" aria-label="Block on mobile">
        <li>
          <Cell>From md: one</Cell>
        </li>
        <li>
          <Cell>From md: two</Cell>
        </li>
      </AutoGrid>
    </div>
  ),
};

export const Container: StoryObj = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <FluidContainer className="bg-panel py-6">
      <Cell>FluidContainer: 1248px column, 24px gutters (16px on mobile)</Cell>
    </FluidContainer>
  ),
};

export const Sections: StoryObj = {
  render: () => (
    <FluidContainer className="py-6">
      <FluidSection id="stacked-demo" aria-labelledby="stacked-demo-title">
        <SectionHeader id="stacked-demo-title" title="Stacked" meta="DEFAULT" />
        <Cell>Stacked, hairline-separated on mobile</Cell>
      </FluidSection>
      <FluidSection
        id="plain-demo"
        aria-labelledby="plain-demo-title"
        stack={false}
        divided={false}
        className="mt-10"
      >
        <SectionHeader id="plain-demo-title" title="Plain" size="md" />
        <Cell>No stack, no divider</Cell>
      </FluidSection>
    </FluidContainer>
  ),
};
