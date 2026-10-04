import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { AudioProvider, useAudio } from "./audio";

const wrapper = ({ children }: { children: ReactNode }) => (
  <AudioProvider>{children}</AudioProvider>
);

describe("audio service", () => {
  it("defaults to enabled but locked until a user gesture", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    expect(result.current.enabled).toBe(true);
    expect(result.current.unlocked).toBe(false);
  });

  it("toggling persists the preference", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    act(() => result.current.toggle());
    expect(result.current.enabled).toBe(false);
    expect(localStorage.getItem("arena:audio")).toBe("off");
  });

  it("play is a safe no-op with no sound files", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    act(() => result.current.unlock());
    expect(() => result.current.play("crowd")).not.toThrow();
  });
});
