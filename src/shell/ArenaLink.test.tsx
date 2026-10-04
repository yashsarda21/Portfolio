import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ArenaLink } from "./ArenaLink";

const go = vi.fn(() => Promise.resolve());
vi.mock("./transition", () => ({ useArenaTransition: () => ({ go, busy: false }) }));

function setup() {
  const router = createMemoryRouter([
    { path: "/", element: <ArenaLink to="/career">Career</ArenaLink> },
  ]);
  render(<RouterProvider router={router} />);
  return screen.getByRole("link", { name: "Career" });
}

describe("ArenaLink", () => {
  it("keeps a real href for no-JS and crawlers", () => {
    expect(setup()).toHaveAttribute("href", "/career");
  });

  it("plain click runs the wipe transition", async () => {
    go.mockClear();
    await userEvent.click(setup());
    expect(go).toHaveBeenCalledWith("/career", "wipe");
  });

  it("modified clicks are left to the browser", async () => {
    go.mockClear();
    const link = setup();
    // One instance: the direct userEvent.* calls each get fresh keyboard state, so a held Meta would be lost.
    const user = userEvent.setup();
    await user.keyboard("{Meta>}");
    await user.click(link);
    await user.keyboard("{/Meta}");
    expect(go).not.toHaveBeenCalled();
  });
});
