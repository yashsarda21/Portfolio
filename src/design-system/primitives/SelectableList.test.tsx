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

function BareHarness() {
  const [value, setValue] = useState("a");
  return (
    <SelectableList.Root value={value} onValueChange={setValue} orientation="horizontal">
      <SelectableList.List label="Shelf">
        <SelectableList.Item value="a" variant="bare">
          Cup
        </SelectableList.Item>
        <SelectableList.Item value="b" variant="bare">
          Medal
        </SelectableList.Item>
        <SelectableList.Item value="c" variant="bare" disabled aria-label="Hidden, locked">
          Locked
        </SelectableList.Item>
        <SelectableList.Item value="d" variant="bare">
          Round
        </SelectableList.Item>
      </SelectableList.List>
    </SelectableList.Root>
  );
}

describe("SelectableList bare items and disabled items", () => {
  it("the bare look carries no row chrome but keeps group/item", () => {
    render(<BareHarness />);
    const tab = screen.getByRole("tab", { name: "Cup" });
    expect(tab).toHaveClass("group/item", "border-0");
    expect(tab).not.toHaveClass("border-l-3");
    expect(tab.className).not.toMatch(/data-\[state=active\]:bg-volt/);
  });

  it("a disabled item points at no panel (it has none); the others do", () => {
    render(<BareHarness />);
    expect(screen.getByRole("tab", { name: "Hidden, locked" })).not.toHaveAttribute(
      "aria-controls",
    );
    expect(screen.getByRole("tab", { name: "Cup" })).toHaveAttribute("aria-controls");
  });

  it("is a horizontal tablist: the arrows move across and skip the disabled tab", async () => {
    const user = userEvent.setup();
    render(<BareHarness />);
    expect(screen.getByRole("tablist", { name: "Shelf" })).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Medal" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Round" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Round" })).toHaveFocus();
  });

  it("announces the disabled tab by its own label and never selects it", async () => {
    const user = userEvent.setup();
    render(<BareHarness />);
    const locked = screen.getByRole("tab", { name: "Hidden, locked" });
    expect(locked).toBeDisabled();
    await user.click(locked);
    expect(locked).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: "Cup" })).toHaveAttribute("aria-selected", "true");
  });
});

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
