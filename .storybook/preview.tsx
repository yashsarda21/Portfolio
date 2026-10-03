import type { Preview } from "@storybook/react-vite";
import "../app/app.css";

const preview: Preview = {
  parameters: {
    layout: "padded",
    backgrounds: { disable: true },
    a11y: { test: "error" },
  },
  decorators: [
    (Story, context) =>
      context.parameters.layout === "fullscreen" ? (
        <div className="bg-ground text-floodlight">
          <Story />
        </div>
      ) : (
        <div className="min-h-dvh bg-ground p-6 text-floodlight">
          <Story />
        </div>
      ),
  ],
};

export default preview;
