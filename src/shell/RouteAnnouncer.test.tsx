import { act, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RouteAnnouncer } from "./RouteAnnouncer";

function Page({ title, withHiddenTitle }: { title: string; withHiddenTitle?: boolean }) {
  return (
    <main>
      {/* The desktop-only Scoreboard title on mobile: first in the DOM, never rendered. */}
      {withHiddenTitle ? <h1 data-hidden="1">Hidden</h1> : null}
      <h1>{title}</h1>
    </main>
  );
}

function setup() {
  const router = createMemoryRouter([
    {
      element: (
        <>
          <RouteAnnouncer />
          <Outlet />
        </>
      ),
      children: [
        { path: "/", element: <Page title="Home" /> },
        { path: "/next", element: <Page title="Next" withHiddenTitle /> },
      ],
    },
  ]);
  render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
  return router;
}

const frames = (n: number) =>
  act(async () => {
    for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(() => r(null)));
  });

describe("RouteAnnouncer (strict mode)", () => {
  beforeEach(() => {
    document.title = "Next page title";
    // jsdom has no layout: report every element as rendered.
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(function (
      this: HTMLElement,
    ) {
      return (this.dataset.hidden ? [] : [{}]) as unknown as DOMRectList;
    });
  });

  it("neither focuses nor announces on the initial render", async () => {
    setup();
    await frames(6);
    expect(document.activeElement).toBe(document.body);
    expect(document.querySelector("[aria-live]")).toBeEmptyDOMElement();
  });

  it("focuses the new heading and announces the title after navigation", async () => {
    const router = setup();
    await frames(6);
    await act(() => router.navigate("/next"));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Next" })).toHaveFocus());
    await waitFor(() =>
      expect(document.querySelector("[aria-live]")).toHaveTextContent("Next page title"),
    );
    expect(document.querySelector("[aria-live]")).toHaveAttribute("aria-live", "polite");
  });

  it("focuses the first rendered heading, not a hidden one before it", async () => {
    const router = setup();
    await frames(6);
    await act(() => router.navigate("/next"));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Next" })).toHaveFocus());
    expect(document.querySelector("[data-hidden]")).not.toHaveFocus();
  });
});
