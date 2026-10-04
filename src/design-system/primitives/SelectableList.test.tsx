import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SelectableList } from "./SelectableList";

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
});
