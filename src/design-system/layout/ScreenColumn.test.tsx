import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScreenColumn } from "./ScreenColumn";

function column(props: { until?: "md" | "lg"; className?: string } = {}) {
  return render(
    <ScreenColumn
      until={props.until ?? "lg"}
      className={props.className}
      data-landing-column=""
      backdrop={<div data-testid="backdrop" />}
      top={<span>TOP</span>}
      actions={<button type="button">ACT</button>}
    >
      <p>BOARD</p>
    </ScreenColumn>,
  );
}

describe("ScreenColumn", () => {
  it("is one screen tall at least, in the turf venue, and hides where the Stage takes over", () => {
    const { container, rerender } = column();
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("min-h-dvh", "flex-col", "bg-night", "lg:hidden");
    expect(root).toHaveAttribute("data-venue", "turf");
    expect(root).toHaveAttribute("data-landing-column");
    rerender(
      <ScreenColumn until="md" top={null} actions={null}>
        x
      </ScreenColumn>,
    );
    expect((container.firstElementChild as HTMLElement).className).toContain("md:hidden");
    expect(container.firstElementChild).not.toHaveClass("lg:hidden");
  });

  it("draws the backdrop first, then the top row, the content and the actions in order", () => {
    const { container } = column();
    const root = container.firstElementChild!;
    expect(root.firstElementChild).toBe(screen.getByTestId("backdrop"));
    const text = root.textContent;
    expect(text).toBe("TOPBOARDACT");
    expect(screen.getByText("TOP").parentElement).toHaveClass(
      "flex",
      "items-center",
      "justify-between",
    );
  });

  it("keeps the gutters, the 640px tablet width and the tablet centring in one place", () => {
    column();
    const frame = screen.getByText("TOP").parentElement!.parentElement!;
    expect(frame).toHaveClass("mx-auto", "w-full", "max-w-160", "px-4", "pt-4", "pb-6", "flex-1");
    // The group (content and actions) is centred in what the top row leaves, below a 56px strip the lights hang in.
    const body = screen.getByText("BOARD").parentElement!;
    expect(body).toHaveClass("flex-1", "flex-col", "justify-center", "pt-14");
    expect(body).not.toHaveClass("mt-auto");
  });

  it("sets the actions a fixed gap under the content (40px on a phone, 56px from a tablet), never pinned to the foot", () => {
    column();
    const actions = screen.getByText("ACT").parentElement!;
    expect(actions).toHaveClass("mt-10", "md:mt-14", "flex", "flex-col", "gap-3");
    expect(actions).not.toHaveClass("mt-auto");
    expect(actions.className).not.toMatch(/\bpt-/);
  });
});
