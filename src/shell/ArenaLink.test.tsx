import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ArenaLink } from "./ArenaLink";

const go = vi.fn(() => Promise.resolve());
vi.mock("./transition", () => ({ useArenaTransition: () => ({ go, busy: false }) }));

function setup(props: Partial<ComponentProps<typeof ArenaLink>> = {}) {
  const router = createMemoryRouter([
    {
      path: "/",
      element: (
        <ArenaLink to="/career" {...props}>
          Career
        </ArenaLink>
      ),
    },
  ]);
  render(<RouterProvider router={router} />);
  return screen.getByRole("link", { name: "Career" });
}

/** Click and report whether the browser would act on it, i.e. nothing called preventDefault. */
async function clickLeftToBrowser(link: HTMLElement) {
  let prevented = true;
  // On document: bubbling reaches it after React's root handlers, so this sees the final state.
  const spy = (e: Event) => {
    prevented = e.defaultPrevented;
    e.preventDefault(); // keep jsdom from "navigating"
  };
  document.addEventListener("click", spy, { once: true });
  await userEvent.click(link);
  return !prevented;
}

describe("ArenaLink", () => {
  it("keeps a real href for no-JS and crawlers", () => {
    expect(setup()).toHaveAttribute("href", "/career");
  });

  it("plain click runs the wipe transition", async () => {
    go.mockClear();
    await userEvent.click(setup());
    expect(go).toHaveBeenCalledWith("/career", "wipe", {});
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

  it("passes replace, state and preventScrollReset to the navigation", async () => {
    go.mockClear();
    await userEvent.click(setup({ replace: true, state: { from: "x" }, preventScrollReset: true }));
    expect(go).toHaveBeenCalledWith("/career", "wipe", {
      replace: true,
      state: { from: "x" },
      preventScrollReset: true,
    });
  });

  it("leaves target=_blank links to the browser", async () => {
    go.mockClear();
    const link = setup({ target: "_blank" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(await clickLeftToBrowser(link)).toBe(true);
    expect(go).not.toHaveBeenCalled();
  });

  it("still wipes for target=_self", async () => {
    go.mockClear();
    await userEvent.click(setup({ target: "_self" }));
    expect(go).toHaveBeenCalledOnce();
  });

  it("leaves reloadDocument links to the browser", async () => {
    go.mockClear();
    expect(await clickLeftToBrowser(setup({ reloadDocument: true }))).toBe(true);
    expect(go).not.toHaveBeenCalled();
  });

  it.each(["/", "#scores", "/#scores"])("no wipe for same-page link %s", async (to) => {
    go.mockClear();
    await userEvent.click(setup({ to })); // the router's own Link handles it in place
    expect(go).not.toHaveBeenCalled();
  });
});
