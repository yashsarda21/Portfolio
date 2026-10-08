import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Drawer } from "./Drawer";

// jsdom has no modal dialog: open and close by the attribute, as a browser does.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

function setup(open: boolean, onClose = vi.fn()) {
  const view = render(
    <Drawer open={open} onClose={onClose} label="Portfolio index" closeLabel="Close index">
      <a href="/career">Career</a>
    </Drawer>,
  );
  return { ...view, onClose };
}

describe("Drawer", () => {
  it("opens a labelled dialog with a close button", () => {
    setup(true);
    const dialog = screen.getByRole("dialog", { name: "Portfolio index" });
    expect(dialog).toHaveAttribute("open");
    expect(dialog).toContainElement(screen.getByRole("button", { name: "Close index" }));
    expect(dialog).toContainElement(screen.getByRole("link", { name: "Career" }));
  });

  it("stays shut while closed", () => {
    setup(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on Escape (the cancel event) without closing itself", () => {
    const { onClose } = setup(true);
    const dialog = screen.getByRole("dialog");
    const cancel = new Event("cancel", { cancelable: true });
    fireEvent(dialog, cancel);
    expect(onClose).toHaveBeenCalledOnce();
    expect(cancel.defaultPrevented).toBe(true);
  });

  it("closes on a click on the backdrop but not inside the panel", async () => {
    const { onClose } = setup(true);
    await userEvent.click(screen.getByRole("link", { name: "Career" }));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes from the close button", async () => {
    const { onClose } = setup(true);
    await userEvent.click(screen.getByRole("button", { name: "Close index" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("returns focus to the element that was focused before it opened", () => {
    const onClose = vi.fn();
    const ui = (open: boolean) => (
      <>
        <button type="button">INDEX</button>
        <Drawer open={open} onClose={onClose} label="Portfolio index" closeLabel="Close index">
          x
        </Drawer>
      </>
    );
    const { rerender } = render(ui(false));
    const trigger = screen.getByRole("button", { name: "INDEX" });
    trigger.focus();
    rerender(ui(true));
    screen.getByRole("button", { name: "Close index" }).focus();
    rerender(ui(false));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
  });
});
