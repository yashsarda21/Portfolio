import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { ArenaShell } from "./ArenaShell";

function shell() {
  const router = createMemoryRouter([
    { path: "*", element: <ArenaShell>{<p>page</p>}</ArenaShell> },
  ]);
  return render(<RouterProvider router={router} />);
}

describe("ArenaShell", () => {
  it("marks <html> data-hydrated once it is running, and clears it on unmount", () => {
    expect(document.documentElement).not.toHaveAttribute("data-hydrated");
    const { unmount } = shell();
    expect(document.documentElement).toHaveAttribute("data-hydrated");
    unmount();
    expect(document.documentElement).not.toHaveAttribute("data-hydrated");
  });
});
