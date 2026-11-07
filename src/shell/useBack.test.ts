import { createElement, type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { BrowserRouter, useLocation, useNavigate } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { useBack } from "./useBack";

beforeEach(() => {
  // A visit that starts on /career: the router's first entry, with nothing before it in the site.
  window.history.replaceState(null, "", "/career");
});

function setup() {
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(BrowserRouter, null, children);
  return renderHook(
    () => ({ back: useBack("/arena"), go: useNavigate(), path: useLocation().pathname }),
    { wrapper },
  );
}

describe("useBack", () => {
  it("goes to the fallback when the page was opened directly", () => {
    const { result } = setup();
    act(() => result.current.back());
    expect(result.current.path).toBe("/arena");
  });

  it("steps back after a navigation inside the site", async () => {
    const { result } = setup();
    act(() => void result.current.go("/highlights"));
    expect(result.current.path).toBe("/highlights");
    act(() => result.current.back());
    await waitFor(() => expect(result.current.path).toBe("/career"));
  });
});
