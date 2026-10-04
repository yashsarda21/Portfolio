import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SelectableList, selectableRowVariants } from "./SelectableList";

const ROWS = ["01", "02", "03"];

function Harness({ onChange }: { onChange?: (v: string) => void }) {
  const [value, setValue] = useState("01");
  return (
    <SelectableList.Root
      value={value}
      onValueChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    >
      <SelectableList.List label="Innings">
        {ROWS.map((r) => (
          <SelectableList.Item key={r} value={r}>
            Row {r}
          </SelectableList.Item>
        ))}
      </SelectableList.List>
      {ROWS.map((r) => (
        <SelectableList.Panel key={r} value={r}>
          Detail {r}
        </SelectableList.Panel>
      ))}
    </SelectableList.Root>
  );
}

describe("SelectableList", () => {
  it("renders a tablist with an accessible name, vertical by default", () => {
    render(<Harness />);
    const list = screen.getByRole("tablist", { name: "Innings" });
    expect(list).toHaveAttribute("aria-orientation", "vertical");
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("marks the selected tab with aria-selected and data-state=active", () => {
    render(<Harness />);
    const [first, second] = screen.getAllByRole("tab");
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(first).toHaveAttribute("data-state", "active");
    expect(second).toHaveAttribute("aria-selected", "false");
    expect(second).toHaveAttribute("data-state", "inactive");
  });

  it("gives every item the group/item class so inner parts can follow its state", () => {
    render(<Harness />);
    expect(screen.getAllByRole("tab")[0]).toHaveClass("group/item");
  });

  it("ArrowDown moves the selection and reports it (controlled)", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);
    await user.tab();
    expect(screen.getAllByRole("tab")[0]).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(onChange).toHaveBeenCalledWith("02");
    const second = screen.getAllByRole("tab")[1]!;
    expect(second).toHaveAttribute("aria-selected", "true");
    expect(second).toHaveFocus();
  });

  it("Home and End jump to the first and last tab", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    await user.keyboard("{End}");
    expect(screen.getAllByRole("tab")[2]).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Home}");
    expect(screen.getAllByRole("tab")[0]).toHaveAttribute("aria-selected", "true");
  });

  it("keeps every panel in the DOM and hides the inactive ones", () => {
    const { container } = render(<Harness />);
    const panels = container.querySelectorAll('[role="tabpanel"]');
    expect(panels).toHaveLength(3);
    expect(panels[0]).not.toHaveAttribute("hidden");
    expect(panels[1]).toHaveAttribute("hidden");
    expect(panels[2]).toHaveAttribute("hidden");
    // Inactive text is still in the HTML (pre-rendered), just not visible.
    expect(screen.getByText("Detail 03")).toBeInTheDocument();
    expect(screen.getByText("Detail 01")).toBeVisible();
    expect(screen.getByText("Detail 02")).not.toBeVisible();
  });

  it("moves the visible panel with the selection", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("tab", { name: "Row 02" }));
    expect(screen.getByText("Detail 02")).toBeVisible();
    expect(screen.getByText("Detail 01")).not.toBeVisible();
  });

  it("draws a link as a row of the list, outside the tablist and out of the tab roles", () => {
    render(
      <SelectableList.Root value="01" onValueChange={() => {}}>
        <SelectableList.List label="Innings">
          <SelectableList.Item value="01">Row 01</SelectableList.Item>
        </SelectableList.List>
        <SelectableList.LinkRow href="/trophies#academy">Academy</SelectableList.LinkRow>
      </SelectableList.Root>,
    );
    const link = screen.getByRole("link", { name: "Academy" });
    expect(link).toHaveAttribute("href", "/trophies#academy");
    expect(screen.getByRole("tablist")).not.toContainElement(link);
    expect(screen.getAllByRole("tab")).toHaveLength(1);
  });

  it("LinkRow renders as another element and takes the row look from one shared definition", () => {
    render(
      <SelectableList.LinkRow as="button" type="button" className="min-h-21">
        Custom
      </SelectableList.LinkRow>,
    );
    const row = screen.getByRole("button", { name: "Custom" });
    // The same classes the tab rows use, so changing one changes both.
    for (const cls of selectableRowVariants().split(" ")) {
      if (cls !== "min-h-11") expect(row).toHaveClass(cls);
    }
    expect(row).toHaveClass("min-h-21");
  });
});
