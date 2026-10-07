import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigate = vi.fn(() => Promise.resolve());
vi.mock("react-router", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ key: "k" }),
}));
const loadGsap = vi.fn();
const prefetchGsap = vi.fn();
let reduced = false;
vi.mock("@/lib/motion", () => ({
  loadGsap: () => loadGsap(),
  prefetchGsap: () => prefetchGsap(),
  prefersReducedMotion: () => reduced,
}));

import { TransitionProvider, useArenaTransition } from "./transition";

function Go() {
  const { go } = useArenaTransition();
  return <button onClick={() => void go("/scout")}>go</button>;
}
const setup = () =>
  render(
    <TransitionProvider>
      <Go />
    </TransitionProvider>,
  );

describe("TransitionProvider", () => {
  beforeEach(() => {
    navigate.mockClear();
    loadGsap.mockReset();
    prefetchGsap.mockClear();
    reduced = false;
  });
  afterEach(() => vi.unstubAllGlobals());

  it("warms the GSAP chunk once on mount", () => {
    setup();
    expect(prefetchGsap).toHaveBeenCalledTimes(1);
  });

  it("with reduced motion navigates at once and never loads or prefetches GSAP", async () => {
    reduced = true;
    setup();
    await act(async () => screen.getByText("go").click());
    expect(navigate).toHaveBeenCalledWith("/scout", undefined);
    expect(loadGsap).not.toHaveBeenCalled();
    expect(prefetchGsap).not.toHaveBeenCalled();
  });

  it("navigates without the wipe if the GSAP chunk fails to load", async () => {
    loadGsap.mockRejectedValue(new Error("offline"));
    setup();
    await act(async () => screen.getByText("go").click());
    expect(loadGsap).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/scout", undefined);
  });
});
