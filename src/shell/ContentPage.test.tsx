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

  it("a title prop replaces the h1 text but not the breadcrumb's last crumb", () => {
    setup({ title: "PLAYER PROFILE", trail: [] });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("PLAYER PROFILE");
    expect(screen.getByRole("navigation", { name: ui.pages.breadcrumb })).toHaveTextContent(
      ui.routes.career.heading,
    );
  });

  it("puts a stage and a rail inside main", () => {
    setup({ stage: <p>STAGE</p>, rail: <p>RAIL</p> });
    const main = screen.getByRole("main");
    expect(within(main).getByText("STAGE")).toBeInTheDocument();
    expect(within(main).getByText("RAIL")).toBeInTheDocument();
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

  it("keeps the header and the tab bar outside the main landmark", () => {
    setup();
    const main = screen.getByRole("main");
    expect(main).not.toContainElement(screen.getByRole("banner"));
    expect(main).not.toContainElement(screen.getByRole("navigation", { name: ui.tabs.label }));
    expect(main).toContainElement(screen.getByText("PANELS"));
  });

  it("sets data-venue on the page root only when given", () => {
    const { container, unmount } = setup({ venue: "turf" });
    expect(container.querySelector("[data-venue]")).toHaveAttribute("data-venue", "turf");
    expect(screen.getByRole("main")).not.toHaveAttribute("data-venue");
    unmount();
    const second = setup();
    expect(second.container.querySelector("[data-venue]")).toBeNull();
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

  it.each([
    ["turf", { glow: ["80%", "115%", "0.4"], sky: "0.14" }],
    ["court", { glow: ["70%", "110%", "0.45"], sky: "0.12" }],
  ] as const)("draws the glows the %s artboard draws, with no per-page values", (venue, want) => {
    const { container } = setup({ venue });
    const glow = container.querySelector<HTMLElement>(".scene-venue-glow")!;
    expect([
      glow.style.getPropertyValue("--glow-w"),
      glow.style.getPropertyValue("--glow-y"),
      glow.style.getPropertyValue("--glow-a"),
    ]).toEqual(want.glow);
    expect(
      container.querySelector<HTMLElement>(".scene-sky")!.style.getPropertyValue("--sky-a"),
    ).toBe(want.sky);
  });

  it("the hall's sky takes the venue's warm light; the other venues keep the sky blue", () => {
    const hall = setup({ venue: "hall" });
    expect(hall.container.querySelector(".scene-sky")).toHaveClass("scene-sky-venue");
    hall.unmount();
    const turf = setup({ venue: "turf" });
    expect(turf.container.querySelector(".scene-sky")).not.toHaveClass("scene-sky-venue");
  });

  it("lets a page override the venue's glows", () => {
    const { container } = setup({
      venue: "turf",
      glow: { x: "10%", y: "100%", w: "30%", h: "20%", alpha: 0.9 },
    });
    expect(
      container.querySelector<HTMLElement>(".scene-venue-glow")!.style.getPropertyValue("--glow-a"),
    ).toBe("0.9");
  });

  it("has no venue glow without a venue, only the sky", () => {
    const { container } = setup();
    expect(container.querySelector(".scene-venue-glow")).toBeNull();
    expect(container.querySelector(".scene-sky")).not.toBeNull();
  });

  it("uses a custom backdrop in place of the default glows", () => {
    setup({ backdrop: <div data-testid="custom-backdrop" /> });
    expect(screen.getByTestId("custom-backdrop")).toBeInTheDocument();
  });

  it("draws no backdrop at all when it is null (a plain ground)", () => {
    const { container } = setup({ backdrop: null });
    expect(container.querySelector(".scene-sky")).toBeNull();
    expect(container.querySelector(".scene-venue-glow")).toBeNull();
  });

  it("sets data-zone on the page root only when given a zone", () => {
    const { container, unmount } = setup({ zone: "trophy" });
    expect(container.querySelector("[data-zone]")).toHaveAttribute("data-zone", "trophy");
    expect(screen.getByRole("main")).not.toHaveAttribute("data-zone");
    unmount();
    const second = setup();
    expect(second.container.querySelector("[data-zone]")).toBeNull();
  });

  it("has no footer without next or comm, so the panels run to the bottom gutter", () => {
    setup();
    expect(screen.getByRole("main").children).toHaveLength(2);
  });

  it("has the commentary + next footer when either is given", () => {
    const { unmount } = setup({ comm: "A line." });
    expect(screen.getByRole("main").children).toHaveLength(3);
    unmount();
    setup({ next: { label: ui.hud.nextVenue, to: ROUTES.highlights } });
    expect(screen.getByRole("main").children).toHaveLength(3);
  });
});
