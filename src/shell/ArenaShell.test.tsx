import { act, render, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { ArenaShell } from "./ArenaShell";
import { MATCH_RECORD_KEY, useMatchRecord } from "./matchRecord";

function shell(path = "/") {
  const router = createMemoryRouter(
    [{ path: "*", element: <ArenaShell>{<p>page</p>}</ArenaShell> }],
    {
      initialEntries: [path],
    },
  );
  return { router, ...render(<RouterProvider router={router} />) };
}

describe("ArenaShell", () => {
  beforeEach(() => {
    localStorage.clear();
    useMatchRecord.getState().reset();
  });

  it("marks <html> data-hydrated once it is running, and clears it on unmount", () => {
    expect(document.documentElement).not.toHaveAttribute("data-hydrated");
    const { unmount } = shell();
    expect(document.documentElement).toHaveAttribute("data-hydrated");
    unmount();
    expect(document.documentElement).not.toHaveAttribute("data-hydrated");
  });

  it("marks a section seen when its page opens, and nothing for the Hub", async () => {
    const { router } = shell("/career");
    await waitFor(() => expect(useMatchRecord.getState().sectionsSeen).toContain("career"));
    await act(() => router.navigate("/arena"));
    expect(useMatchRecord.getState().sectionsSeen).toEqual(["career"]);
  });

  it("a direct load keeps what was already saved and adds the page", async () => {
    localStorage.setItem(
      MATCH_RECORD_KEY,
      JSON.stringify({ state: { sectionsSeen: ["highlights"] }, version: 1 }),
    );
    shell("/career");
    await waitFor(() =>
      expect([...useMatchRecord.getState().sectionsSeen].sort()).toEqual(["career", "highlights"]),
    );
  });
});
