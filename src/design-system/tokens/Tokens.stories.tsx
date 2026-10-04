import type { Meta, StoryObj } from "@storybook/react-vite";
import { cn } from "@/lib/cn";
import { TOKEN_CATALOG } from "./catalog";

const meta: Meta = { title: "Foundations/Tokens" };
export default meta;

export const Colours: StoryObj = {
  render: () => (
    <div className="grid grid-cols-6 gap-4">
      {TOKEN_CATALOG.colors.map((c) => (
        // Gold and silver only resolve inside the trophy zone (spec §5.1), so their swatches live in one.
        <figure
          key={c.name}
          className="flex flex-col gap-2"
          data-zone={c.name === "gold" || c.name.startsWith("trophy-") ? "trophy" : undefined}
        >
          <div className={cn("h-16 border border-line", c.className)} aria-hidden="true" />
          <figcaption className="type-mono-tag text-scout">{c.name}</figcaption>
        </figure>
      ))}
    </div>
  ),
};

export const Type: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6">
      {TOKEN_CATALOG.type.map((name) => (
        <div key={name} className="flex flex-col gap-1 border-b border-line pb-4">
          <span className="type-mono-tag text-dim">{name}</span>
          <span className={name}>Think you can beat me?</span>
        </div>
      ))}
    </div>
  ),
};

export const Shadows: StoryObj = {
  render: () => (
    <div className="grid grid-cols-4 gap-10 p-10">
      {TOKEN_CATALOG.shadows.map((s) => (
        <div key={s.name} className={cn("flex h-24 items-end bg-panel p-3", s.className)}>
          <span className="type-mono-tag text-scout">{s.name}</span>
        </div>
      ))}
    </div>
  ),
};

export const Surfaces: StoryObj = {
  render: () => (
    <div className="flex gap-6">
      <div className="glass p-5 type-body">glass</div>
      <div className="glass-solid p-5 type-body">glass-solid</div>
      <div className="bar p-5 type-body">bar</div>
    </div>
  ),
};
