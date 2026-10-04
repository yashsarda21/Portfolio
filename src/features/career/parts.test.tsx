import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
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

/** The page's own wiring: the selected row lives in state, as in CareerPage. */
function Harness() {
  const [selected, setSelected] = useState(view.defaultId);
  return (
    <SelectableList.Root value={selected} onValueChange={setSelected}>
      <Scorecard view={view} />
      <InningsDetail rows={view.rows} />
    </SelectableList.Root>
  );
}

function renderScorecard() {
  const router = createMemoryRouter([
    {
      path: "*",
      element: (
        <ArenaShell>
          <Harness />
        </ArenaShell>
      ),
    },
  ]);
  return render(<RouterProvider router={router} />);
}

describe("Scorecard", () => {
  it("draws one tab per row, the academy included, and no link rows", () => {
    renderScorecard();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs).toHaveLength(view.rows.length);
    expect(within(screen.getByRole("tablist")).queryByRole("link")).toBeNull();
    expect(tabs[2]).toHaveAccessibleName(new RegExp(ui.pages.career.academy));
    expect(tabs[2]).toHaveClass("group/item", "border-l-3");
  });

  it("shows the short degree in the academy row", () => {
    renderScorecard();
    expect(screen.getByRole("tab", { name: /B\.Tech IT/ })).toBeInTheDocument();
    expect(screen.queryByText(content.trainingAcademy.degree)).toBeNull();
  });

  it("hides the decorative column header from assistive tech", () => {
    renderScorecard();
    const header = screen.getByText(view.cols.inn).parentElement!;
    expect(header).toHaveAttribute("aria-hidden", "true");
  });
});

describe("InningsDetail", () => {
  it("names each shots list by its visible heading (innings panels only)", () => {
    renderScorecard();
    // The panels are all in the HTML; only the selected one is visible, so look them up by hidden too.
    const lists = screen.getAllByRole("list", { name: ui.pages.career.shots, hidden: true });
    expect(lists).toHaveLength(2);
  });

  it("selecting the academy shows the school, its lines and the trophy room link", async () => {
    const user = userEvent.setup();
    renderScorecard();
    const trophyLink = () =>
      screen.queryByRole("link", { name: new RegExp(ui.pages.career.academyLink) });
    // Hidden until selected, and the link lives only inside the academy panel.
    expect(trophyLink()).toBeNull();
    await user.click(screen.getByRole("tab", { name: new RegExp(ui.pages.career.academy) }));
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByRole("heading", { level: 2 })).toHaveTextContent(
      "Pune Institute of Computer Technology",
    );
    expect(
      within(panel).getByText(`${ui.scout.cgpa} ${content.trainingAcademy.cgpa}`),
    ).toBeVisible();
    for (const line of content.trainingAcademy.extras) {
      expect(within(panel).getByText(line)).toBeVisible();
    }
    expect(within(panel).queryByRole("list", { name: ui.pages.career.shots })).toBeNull();
    const link = trophyLink();
    expect(link).toHaveAttribute("href", "/trophies#academy");
    expect(panel).toContainElement(link);
  });
});
