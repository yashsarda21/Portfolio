import { render, screen, within } from "@testing-library/react";
import { StrictMode, type ComponentProps } from "react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { ui } from "@/content";
import { ArenaShell } from "./ArenaShell";
import { ContentPage } from "./ContentPage";
import { ROUTES } from "./routes";

type Props = Partial<ComponentProps<typeof ContentPage>>;

function setup(props: Props = {}, at: string = ROUTES.career) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <ArenaShell>
            <Outlet />
          </ArenaShell>
        ),
        children: [
          {
            path: at,
            element: (
              <ContentPage
                route="career"
                trail={[ui.venues.cricket]}
                eyebrow={ui.pages.career.eyebrow}
                {...props}
              >
                <p>PANELS</p>
              </ContentPage>
            ),
          },
        ],
      },
    ],
    { initialEntries: [at] },
  );
  return render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

describe("ContentPage", () => {
  it("renders main#main with a single h1 of the route heading and the panels", () => {
    setup();
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main");
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(ui.routes.career.heading);
    expect(within(main).getByText("PANELS")).toBeInTheDocument();
    expect(within(main).getByText(ui.pages.career.eyebrow)).toBeInTheDocument();
  });

  it("starts the breadcrumb at the hub and ends it with the page", () => {
    setup();
    const crumbs = screen.getByRole("navigation", { name: ui.pages.breadcrumb });
    expect(
      within(crumbs).getByRole("link", { name: new RegExp(ui.placeholder.hub) }),
    ).toHaveAttribute("href", ROUTES.arena);
    expect(within(crumbs).getByText(ui.venues.cricket)).toBeInTheDocument();
    expect(within(crumbs).getByText(ui.routes.career.heading)).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("links REMATCH to the given route and omits it otherwise", () => {
    const { unmount } = setup({ rematch: ROUTES.cricket });
    expect(screen.getByRole("link", { name: ui.hud.rematch })).toHaveAttribute(
      "href",
      ROUTES.cricket,
    );
    unmount();
    setup();
    expect(screen.queryByRole("link", { name: ui.hud.rematch })).toBeNull();
  });

  it("links QUICK VIEW to the scouting report", () => {
    setup();
    expect(screen.getByRole("link", { name: ui.hud.quickView })).toHaveAttribute(
      "href",
      ROUTES.scout,
    );
  });

  it("renders the next CTA with a decorative arrow", () => {
    setup({ next: { label: ui.hud.nextVenue, to: ROUTES.highlights } });
    const cta = screen.getByRole("link", { name: ui.hud.nextVenue });
    expect(cta).toHaveAttribute("href", ROUTES.highlights);
    expect(cta.querySelector("[aria-hidden='true']:not([data-plate])")).toHaveTextContent(
      ui.glyph.next,
    );
  });

  it("sets data-venue on the page root only when given", () => {
    const { unmount } = setup({ venue: "turf" });
    expect(screen.getByRole("main")).toHaveAttribute("data-venue", "turf");
    unmount();
    setup();
    expect(screen.getByRole("main")).not.toHaveAttribute("data-venue");
  });

  it("marks the current route in the mobile tab bar", () => {
    setup();
    const tabs = screen.getByRole("navigation", { name: ui.tabs.label });
    expect(within(tabs).getByRole("link", { name: ui.tabs.career })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(tabs).getByRole("link", { name: ui.tabs.arena })).toHaveAttribute(
      "href",
      ROUTES.arena,
    );
    expect(within(tabs).getByRole("link", { name: ui.tabs.projects })).toHaveAttribute(
      "href",
      ROUTES.highlights,
    );
    expect(within(tabs).getByRole("link", { name: ui.tabs.skills })).toHaveAttribute(
      "href",
      ROUTES.attributes,
    );
    expect(within(tabs).getByRole("link", { name: ui.tabs.teamUp })).toHaveAttribute(
      "href",
      ROUTES.teamUp,
    );
    expect(within(tabs).queryAllByRole("link", { current: "page" })).toHaveLength(1);
  });

  it("uses a custom backdrop in place of the default glows", () => {
    setup({ backdrop: <div data-testid="custom-backdrop" /> });
    expect(screen.getByTestId("custom-backdrop")).toBeInTheDocument();
  });
});
