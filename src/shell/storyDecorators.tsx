import type { Decorator } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ArenaShell } from "./ArenaShell";

/** Storybook has no router; ArenaLink and the shell services (commentary, transitions) need one. */
export function WithShell({ children, at = "/" }: { children: ReactNode; at?: string }) {
  const [router] = useState(() =>
    createMemoryRouter([{ path: "*", element: <ArenaShell>{children}</ArenaShell> }], {
      initialEntries: [at],
    }),
  );
  return <RouterProvider router={router} />;
}

/** Story decorator: a memory router plus ArenaShell around the story. A story stands on another route (so the tab bar knows its current tab) with `parameters: { route: "/arena" }`. */
export const withShell: Decorator = (Story, context) => (
  <WithShell at={(context.parameters.route as string | undefined) ?? "/"}>
    <Story />
  </WithShell>
);
