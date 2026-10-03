import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "./Icon";
import { ICONS, type IconName } from "./icons";

const meta: Meta<typeof Icon> = { title: "Primitives/Icon", component: Icon };
export default meta;

export const All: StoryObj<typeof Icon> = {
  render: () => (
    <ul className="grid grid-cols-6 gap-6">
      {(Object.keys(ICONS) as IconName[]).map((name) => (
        <li key={name} className="flex flex-col items-center gap-2 text-floodlight">
          <Icon name={name} size={24} />
          <span className="type-mono-tag text-scout">{name}</span>
        </li>
      ))}
    </ul>
  ),
};
