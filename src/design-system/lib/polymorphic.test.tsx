import { render, screen } from "@testing-library/react";
import type { ElementType } from "react";
import { describe, expect, it } from "vitest";
import type { PolymorphicProps } from "./polymorphic";

type BoxProps<T extends ElementType> = PolymorphicProps<T, { tone?: "a" | "b" }>;

function Box<T extends ElementType = "div">({ as, tone, ...rest }: BoxProps<T>) {
  const Comp: ElementType = as ?? "div";
  return <Comp data-tone={tone} {...rest} />;
}

describe("PolymorphicProps", () => {
  it("renders the default element", () => {
    render(<Box>hi</Box>);
    expect(screen.getByText("hi").tagName).toBe("DIV");
  });

  it("renders the element passed in `as` with its own props", () => {
    render(
      <Box as="a" href="/scout" tone="a">
        go
      </Box>,
    );
    const link = screen.getByRole("link", { name: "go" });
    expect(link).toHaveAttribute("href", "/scout");
    expect(link).toHaveAttribute("data-tone", "a");
  });

  it("rejects props that do not belong to the element (type-level)", () => {
    // @ts-expect-error — `href` is not a valid prop on a <button>
    render(<Box as="button" href="/nope" />);
    expect(true).toBe(true);
  });
});
