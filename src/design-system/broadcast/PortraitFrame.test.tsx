import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PortraitFrame } from "./PortraitFrame";

describe("PortraitFrame", () => {
  it("renders the image with its alt and explicit width and height", () => {
    render(<PortraitFrame src="/p.webp" alt="Yash Sarda" size="attr" />);
    const img = screen.getByRole("img", { name: "Yash Sarda" });
    expect(img).toHaveAttribute("src", "/p.webp");
    expect(img).toHaveAttribute("width", "320");
    expect(img).toHaveAttribute("height", "258");
  });

  it("draws the card size at the card artboard's image size", () => {
    render(<PortraitFrame src="/p.webp" alt="Yash Sarda" size="card" />);
    const img = screen.getByRole("img", { name: "Yash Sarda" });
    expect(img).toHaveAttribute("width", "340");
    expect(img).toHaveAttribute("height", "274");
  });

  it("shows the badge value and label", () => {
    render(
      <PortraitFrame
        src="/p.webp"
        alt="Yash Sarda"
        size="attr"
        badge={{ value: "SE", label: "POSITION" }}
      />,
    );
    expect(screen.getByText("SE")).toBeInTheDocument();
    expect(screen.getByText("POSITION")).toBeInTheDocument();
  });

  it("has no badge unless given one", () => {
    const { container } = render(<PortraitFrame src="/p.webp" alt="Yash Sarda" size="attr" />);
    expect(container.textContent).toBe("");
  });

  it("is decorative with an empty alt (no img role)", () => {
    const { container } = render(<PortraitFrame src="/p.webp" alt="" size="attr" />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("passes loading through so a phone can lazy-load it", () => {
    render(<PortraitFrame src="/p.webp" alt="Yash Sarda" size="attr" loading="lazy" />);
    expect(screen.getByRole("img")).toHaveAttribute("loading", "lazy");
  });

  it("merges className and forwards a ref (React 19 ref-as-prop)", () => {
    let node: HTMLElement | null = null;
    const { container } = render(
      <PortraitFrame
        src="/p.webp"
        alt="x"
        size="attr"
        className="w-40"
        ref={(el) => {
          node = el;
        }}
      />,
    );
    expect(container.firstElementChild).toHaveClass("w-40");
    expect(node).toBe(container.firstElementChild);
  });
});
