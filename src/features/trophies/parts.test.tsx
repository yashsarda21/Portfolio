import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { content, ui } from "@/content";
import { SelectableList } from "@/design-system";
import { ArenaShell } from "@/shell/ArenaShell";
import { ROUTES } from "@/shell/routes";
import { Cabinet } from "./Cabinet";
import { PlinthDetail } from "./PlinthDetail";
import { TrophiesPage } from "./TrophiesPage";
import { buildTrophiesView } from "./view";

const view = buildTrophiesView(content, ui, ROUTES);
const HINT = ui.pages.trophies.lockedHint;

/** The page's own wiring: the selected trophy lives in state, as in TrophiesPage. */
function Harness() {
  const [selected, setSelected] = useState(view.defaultId);
  return (
    <SelectableList.Root value={selected} onValueChange={setSelected} orientation="horizontal">
      <Cabinet view={view} selected={selected} />
      <PlinthDetail view={view} />
    </SelectableList.Root>
  );
}

function renderWith(node: React.ReactNode) {
  const router = createMemoryRouter([{ path: "*", element: <ArenaShell>{node}</ArenaShell> }]);
  return render(<RouterProvider router={router} />);
}

describe("Cabinet", () => {
  it("is a horizontal tablist named Trophies with one tab per trophy", () => {
    renderWith(<Harness />);
    const list = screen.getByRole("tablist", { name: ui.pages.trophies.listLabel });
    expect(list).toHaveAttribute("aria-orientation", "horizontal");
    expect(within(list).getAllByRole("tab")).toHaveLength(6);
  });

  it("names each tab by its title and shelf line; the art is hidden from assistive tech", () => {
    renderWith(<Harness />);
    expect(screen.getByRole("tab", { name: /750\+ Problems Solved/i })).toHaveAccessibleName(
      /LeetCode · Codeforces · CodeChef/i,
    );
    expect(screen.getByRole("tab", { name: /99\.5 Percentile/i })).toHaveAccessibleName(
      /State Rank 709/i,
    );
    for (const art of document.querySelectorAll("[data-kind]")) {
      expect(art).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("the locked trophy is a disabled tab announced with its hint", () => {
    renderWith(<Harness />);
    const locked = screen.getByRole("tab", { name: `Giant Killer, ${HINT}` });
    expect(locked).toBeDisabled();
    expect(locked).toHaveAttribute("aria-selected", "false");
  });

  it("starts on the cup, and the arrows skip the locked tab", async () => {
    const user = userEvent.setup();
    renderWith(<Harness />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{End}");
    expect(tabs[4]).toHaveAttribute("aria-selected", "true");
    expect(tabs[4]).toHaveFocus();
    // Past the last unlocked tab the arrow wraps to the first, never onto the locked one.
    await user.keyboard("{ArrowRight}");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[5]).toHaveAttribute("aria-selected", "false");
  });

  it("clicking the locked trophy does nothing", async () => {
    const user = userEvent.setup();
    renderWith(<Harness />);
    await user.click(screen.getByRole("tab", { name: /Giant Killer/ }));
    expect(screen.getAllByRole("tab")[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Giant Killer/ })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("only the selected trophy turns, and the turntable follows the selection", async () => {
    const user = userEvent.setup();
    renderWith(<Harness />);
    const turning = () => [...document.querySelectorAll(".animate-turntable")];
    expect(turning()).toHaveLength(1);
    expect(screen.getAllByRole("tab")[0]).toContainElement(turning()[0] as HTMLElement);
    await user.click(screen.getByRole("tab", { name: /99\.5 Percentile/i }));
    expect(turning()).toHaveLength(1);
    expect(screen.getByRole("tab", { name: /99\.5 Percentile/i })).toContainElement(
      turning()[0] as HTMLElement,
    );
  });

  it("lights the selected trophy brightest, and the locked one not at all", async () => {
    const user = userEvent.setup();
    renderWith(<Harness />);
    const lead = () => document.querySelectorAll(".scene-spot.\\[--spot-a\\:0\\.3\\]");
    expect(lead()).toHaveLength(1);
    expect(screen.getAllByRole("tab")[0]).toContainElement(lead()[0] as HTMLElement);
    await user.click(screen.getByRole("tab", { name: /Published Research/i }));
    expect(lead()).toHaveLength(1);
    expect(screen.getByRole("tab", { name: /Published Research/i })).toContainElement(
      lead()[0] as HTMLElement,
    );
    expect(document.querySelectorAll(".scene-spot")).toHaveLength(5);
  });

  it("draws the medal's figure and the plaque's word on the art", () => {
    renderWith(<Harness />);
    expect(
      screen.getByRole("tab", { name: /99\.5 Percentile/i }).querySelector("[data-kind]"),
    ).toHaveTextContent("99.5");
    expect(
      screen.getByRole("tab", { name: /Published Research/i }).querySelector("[data-kind]"),
    ).toHaveTextContent("PAPER");
  });
});

describe("PlinthDetail", () => {
  it("has one panel per unlocked trophy (the locked one has none), all in the HTML", () => {
    renderWith(<Harness />);
    const panels = screen.getAllByRole("tabpanel", { hidden: true });
    expect(panels).toHaveLength(5);
    for (const t of content.trophyRoom.filter((x) => x.type !== "locked")) {
      expect(screen.getByText(t.description)).toBeInTheDocument();
    }
    expect(screen.queryByText(content.trophyRoom.at(-1)!.description)).toBeNull();
  });

  it("shows the selected trophy: label, index, title, sub, description", () => {
    renderWith(<Harness />);
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText(ui.pages.trophies.plinth)).toBeVisible();
    expect(within(panel).getByText("1 / 5")).toBeVisible();
    expect(within(panel).getByRole("heading", { level: 2 })).toHaveTextContent(
      "750+ Problems Solved",
    );
    expect(within(panel).getByText(content.trophyRoom[0]!.description)).toBeVisible();
  });

  it("follows the selection: the medal's panel reads 99.5 Percentile, 2 / 5", async () => {
    const user = userEvent.setup();
    renderWith(<Harness />);
    await user.click(screen.getByRole("tab", { name: /99\.5 Percentile/i }));
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByRole("heading", { level: 2 })).toHaveTextContent("99.5 Percentile");
    expect(within(panel).getByText("2 / 5")).toBeVisible();
    expect(within(panel).getByText("MHT-CET 2020 · State Merit Rank 709")).toBeVisible();
    expect(within(panel).queryByRole("link")).toBeNull();
  });

  it("links open in the same tab, with the arrow hidden from assistive tech", () => {
    renderWith(<Harness />);
    const panel = screen.getByRole("tabpanel");
    const links = within(panel).getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(
      content.trophyRoom[0]!.links.map((l) => l.href),
    );
    for (const link of links) {
      expect(link).not.toHaveAttribute("target");
      expect(link.querySelector("[aria-hidden='true']")).toHaveTextContent(ui.glyph.external);
    }
    expect(links[0]).toHaveAccessibleName("LEETCODE");
  });
});

describe("TrophiesPage", () => {
  it("draws the academy as an h2 section with the #academy id, after the plinth", () => {
    const { container } = renderWith(<TrophiesPage view={view} />);
    const academy = screen.getByRole("region", { name: "TRAINING ACADEMY" });
    expect(academy).toHaveAttribute("id", "academy");
    expect(within(academy).getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(within(academy).getByText("Pune Institute of Computer Technology")).toBeVisible();
    const list = within(academy).getByRole("list", { name: ui.pages.trophies.academy.extras });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(container.querySelector("[data-zone='trophy']")).not.toBeNull();
  });

  it("has the h1 and the way on to the player card", () => {
    renderWith(<TrophiesPage view={view} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(ui.routes.trophies.heading);
    expect(screen.getByRole("link", { name: new RegExp(ui.pages.trophies.next) })).toHaveAttribute(
      "href",
      ROUTES.card,
    );
  });
});
