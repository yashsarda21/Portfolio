import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../primitives/Button";
import { LinkRow } from "../primitives/LinkRow";
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
