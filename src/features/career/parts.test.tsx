import { render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { content, ui } from "@/content";
import { SelectableList } from "@/design-system";
import { ArenaShell } from "@/shell/ArenaShell";
import { ROUTES } from "@/shell/routes";
import { InningsDetail } from "./InningsDetail";
import { Scorecard } from "./Scorecard";
import { buildCareerView } from "./view";

const view = buildCareerView(content, ui, ROUTES);

function renderScorecard() {
  const router = createMemoryRouter([
    {
      path: "*",
      element: (
        <ArenaShell>
          <SelectableList.Root value={view.defaultId} onValueChange={() => {}}>
            <Scorecard view={view} />
            <InningsDetail rows={view.rows} />
          </SelectableList.Root>
        </ArenaShell>
      ),
    },
  ]);
  return render(<RouterProvider router={router} />);
}

describe("Scorecard", () => {
  it("draws one tab per innings, and the academy as a link beside them (not a tab)", () => {
    renderScorecard();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(view.rows.length);
    const academy = screen.getByRole("link", { name: new RegExp(ui.pages.career.academy) });
    expect(academy).toHaveAttribute("href", "/trophies#academy");
    expect(within(screen.getByRole("tablist")).queryByRole("link")).toBeNull();
    // The one row definition: the link is dressed exactly like a tab row.
    expect(academy).toHaveClass("group/item", "border-l-3");
    expect(tabs[0]).toHaveClass("group/item", "border-l-3");
  });

  it("shows the short degree in the academy row", () => {
    renderScorecard();
    expect(screen.getByRole("link", { name: /B\.Tech IT/ })).toBeInTheDocument();
    expect(screen.queryByText(content.trainingAcademy.degree)).toBeNull();
  });

  it("hides the decorative column header from assistive tech", () => {
    renderScorecard();
    const header = screen.getByText(view.cols.inn).parentElement!;
    expect(header).toHaveAttribute("aria-hidden", "true");
  });
});

describe("InningsDetail", () => {
  it("names each shots list by its visible heading", () => {
    renderScorecard();
    // The panels are all in the HTML; only the selected one is visible, so look them up by hidden too.
    const lists = screen.getAllByRole("list", {
      name: view.rows[0]!.detail.shotsLabel,
      hidden: true,
    });
    expect(lists).toHaveLength(view.rows.length);
  });
});
