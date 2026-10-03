import type { Meta, StoryObj } from "@storybook/react-vite";
import { TOKEN_CATALOG } from "./catalog";

const meta: Meta = { title: "Foundations/Tokens" };
export default meta;

export const Colours: StoryObj = {
  render: () => (
    <div className="grid grid-cols-6 gap-4">
      {TOKEN_CATALOG.colors.map((name) => (
        <figure key={name} className="flex flex-col gap-2">
          <div
            className="h-16 border border-line"
            style={{ background: `var(--color-${name})` }}
            aria-hidden="true"
          />
          <figcaption className="type-mono-tag text-scout">{name}</figcaption>
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
      {TOKEN_CATALOG.shadows.map((name) => (
        <div
          key={name}
          className="flex h-24 items-end bg-panel p-3"
          style={{ boxShadow: `var(--shadow-${name})` }}
        >
          <span className="type-mono-tag text-scout">{name}</span>
        </div>
      ))}
    </div>
  ),
};

export const Surfaces: StoryObj = {
  render: () => (
    <div className="flex gap-6">
      <div className="p-5 type-body glass">glass</div>
      <div className="p-5 type-body glass-solid">glass-solid</div>
      <div className="p-5 type-body bar">bar</div>
    </div>
  ),
};
