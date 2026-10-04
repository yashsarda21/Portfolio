import type { Decorator } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ArenaShell } from "./ArenaShell";

/** Storybook has no router; ArenaLink and the shell services (commentary, transitions) need one. */
export function WithShell({ children }: { children: ReactNode }) {
  const [router] = useState(() =>
    createMemoryRouter([{ path: "*", element: <ArenaShell>{children}</ArenaShell> }]),
  );
  return <RouterProvider router={router} />;
}

/** Story decorator: a memory router plus ArenaShell around the story. */
export const withShell: Decorator = (Story) => (
  <WithShell>
    <Story />
  </WithShell>
);
