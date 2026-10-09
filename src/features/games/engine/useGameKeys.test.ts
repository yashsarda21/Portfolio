import { fireEvent, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGameKeys } from "./useGameKeys";

afterEach(() => {
  document.body.innerHTML = "";
});

function setup(active = true) {
  const down = { " ": vi.fn(), Enter: vi.fn(), ArrowLeft: vi.fn() };
  const up = { " ": vi.fn() };
  const hook = renderHook(({ on }) => useGameKeys({ down, up }, { active: on }), {
    initialProps: { on: active },
  });
  return { down, up, ...hook };
}
const focused = (tag: "button" | "a" | "input" | "div", attrs: Record<string, string> = {}) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (tag === "a") el.setAttribute("href", "/x");
  document.body.append(el);
  el.focus();
  return el;
};

describe("useGameKeys", () => {
  it("Space on the body calls down[' '] once; a repeat is ignored", () => {
    const { down } = setup();
    fireEvent.keyDown(document.body, { key: " " });
    fireEvent.keyDown(document.body, { key: " ", repeat: true });
    expect(down[" "]).toHaveBeenCalledTimes(1);
  });

  it("prevents the default of a handled key (Space must not scroll), repeats included", () => {
    setup();
    expect(fireEvent.keyDown(document.body, { key: " " })).toBe(false);
    expect(fireEvent.keyDown(document.body, { key: " ", repeat: true })).toBe(false);
    expect(fireEvent.keyDown(document.body, { key: "x" })).toBe(true);
  });

  it("Space and Enter on a button, a link or a [role=button] do that control's own job, not a shot", () => {
    const { down } = setup();
    for (const el of [
      focused("button"),
      focused("a"),
      focused("div", { role: "button", tabindex: "0" }),
    ]) {
      expect(fireEvent.keyDown(el, { key: " " })).toBe(true);
      expect(fireEvent.keyDown(el, { key: "Enter" })).toBe(true);
    }
    expect(down[" "]).not.toHaveBeenCalled();
    expect(down.Enter).not.toHaveBeenCalled();
  });

  it("an arrow key with focus on a button still counts", () => {
    const { down } = setup();
    fireEvent.keyDown(focused("button"), { key: "ArrowLeft" });
    expect(down.ArrowLeft).toHaveBeenCalledTimes(1);
  });

  it("ignores Ctrl, Cmd and Alt", () => {
    const { down } = setup();
    fireEvent.keyDown(document.body, { key: " ", altKey: true });
    fireEvent.keyDown(document.body, { key: " ", ctrlKey: true });
    fireEvent.keyDown(document.body, { key: " ", metaKey: true });
    expect(down[" "]).not.toHaveBeenCalled();
  });

  it("ignores typing in a field", () => {
    const { down } = setup();
    fireEvent.keyDown(focused("input"), { key: " " });
    fireEvent.keyDown(focused("div", { contenteditable: "true" }), { key: "ArrowLeft" });
    expect(down[" "]).not.toHaveBeenCalled();
    expect(down.ArrowLeft).not.toHaveBeenCalled();
  });

  it("keyup calls up[' ']", () => {
    const { up } = setup();
    fireEvent.keyUp(document.body, { key: " " });
    expect(up[" "]).toHaveBeenCalledTimes(1);
  });

  it("listens on window only while active, and leaves none behind", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { down, rerender, unmount } = setup(false);
    expect(add).not.toHaveBeenCalledWith("keydown", expect.anything());
    rerender({ on: true });
    expect(add).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(add).toHaveBeenCalledWith("keyup", expect.any(Function));
    rerender({ on: false });
    for (const type of ["keydown", "keyup"]) {
      const added = add.mock.calls.filter(([t]) => t === type).map(([, fn]) => fn);
      const removed = remove.mock.calls.filter(([t]) => t === type).map(([, fn]) => fn);
      expect(removed).toEqual(added);
    }
    fireEvent.keyDown(document.body, { key: " " });
    expect(down[" "]).not.toHaveBeenCalled();
    unmount();
  });
});
