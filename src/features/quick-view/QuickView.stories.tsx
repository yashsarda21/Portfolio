import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ArenaShell } from "@/shell/ArenaShell";
import { artboardReport } from "./QuickView.fixture";
import { QuickView, QuickViewScreen } from "./QuickView";

/** Storybook has no router; ArenaLink and the shell services need one. Local to this feature. */
function WithShell({ children }: { children: ReactNode }) {
  const [router] = useState(() =>
    createMemoryRouter([{ path: "*", element: <ArenaShell>{children}</ArenaShell> }]),
  );
  return <RouterProvider router={router} />;
}

const meta: Meta = {
  title: "Features/Quick View",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <WithShell>
        <Story />
      </WithShell>
    ),
  ],
};
export default meta;

/** The real page, built from content. */
export const RealContent: StoryObj = { render: () => <QuickViewScreen /> };

/** The artboard's own copy, compared pixel-for-pixel with QuickView and Mobile-QuickView. */
export const ArtboardParity: StoryObj = { render: () => <QuickView report={artboardReport} /> };
