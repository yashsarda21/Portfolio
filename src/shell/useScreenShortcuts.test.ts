import { fireEvent, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useScreenShortcuts } from "./useScreenShortcuts";

afterEach(() => {
  document.body.innerHTML = "";
});

function setup(enabled = true) {
  const enter = vi.fn();
  const q = vi.fn();
  const hook = renderHook(({ on }) => useScreenShortcuts({ enter, q }, { enabled: on }), {
    initialProps: { on: enabled },
  });
  return { enter, q, ...hook };
}

describe("useScreenShortcuts", () => {
  it("fires the action for the key, matched lowercase", () => {
    const { enter, q } = setup();
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "Q" });
    expect(enter).toHaveBeenCalledTimes(1);
    expect(q).toHaveBeenCalledTimes(1);
  });

  it("ignores keys with no action", () => {
    const { enter, q } = setup();
    fireEvent.keyDown(window, { key: "x" });
    expect(enter).not.toHaveBeenCalled();
    expect(q).not.toHaveBeenCalled();
  });

  it.each(["ctrlKey", "metaKey", "altKey"] as const)("ignores %s", (mod) => {
    const { q } = setup();
    fireEvent.keyDown(window, { key: "q", [mod]: true });
    expect(q).not.toHaveBeenCalled();
  });

  it("ignores a key someone already handled", () => {
    const { q } = setup();
    const e = new KeyboardEvent("keydown", { key: "q", cancelable: true });
    e.preventDefault();
    window.dispatchEvent(e);
    expect(q).not.toHaveBeenCalled();
  });

  it.each([
    ["a", '<a href="/x">x</a>'],
    ["button", "<button>b</button>"],
    ["input", "<input />"],
    ["textarea", "<textarea></textarea>"],
    ["select", "<select><option>1</option></select>"],
    ["contenteditable", '<div contenteditable="true" tabindex="0">t</div>'],
    ["role=button", '<div role="button" tabindex="0">b</div>'],
    ["role=tab", '<div role="tab" tabindex="0">t</div>'],
  ])("ignores a key from %s", (_name, html) => {
    const { enter } = setup();
    document.body.innerHTML = html;
    const el = document.body.firstElementChild!;
    fireEvent.keyDown(el, { key: "Enter" });
    expect(enter).not.toHaveBeenCalled();
  });

  it("ignores a key from inside a link (a child of the link)", () => {
    const { enter } = setup();
    document.body.innerHTML = '<a href="/x"><span>x</span></a>';
    fireEvent.keyDown(document.querySelector("span")!, { key: "Enter" });
    expect(enter).not.toHaveBeenCalled();
  });

  it("fires from the body", () => {
    const { enter } = setup();
    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(enter).toHaveBeenCalledTimes(1);
  });

  it("does nothing while disabled, and starts when enabled", () => {
    const { enter, rerender } = setup(false);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(enter).not.toHaveBeenCalled();
    rerender({ on: true });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(enter).toHaveBeenCalledTimes(1);
  });

  it("uses the latest actions without re-attaching", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ fn }) => useScreenShortcuts({ q: fn }, { enabled: true }), {
      initialProps: { fn: first },
    });
    rerender({ fn: second });
    fireEvent.keyDown(window, { key: "q" });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("stops after unmount", () => {
    const { enter, unmount } = setup();
    unmount();
    fireEvent.keyDown(window, { key: "Enter" });
    expect(enter).not.toHaveBeenCalled();
  });
});
