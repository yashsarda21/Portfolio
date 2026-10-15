import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  // Demo media for stories (MediaSlot replays), served at the root; the 3D models at /models, as the site serves them.
  staticDirs: ["./static", { from: "../public/models", to: "/models" }],
  framework: {
    name: "@storybook/react-vite",
    options: { builder: { viteConfigPath: ".storybook/vite.config.ts" } },
  },
};

export default config;
