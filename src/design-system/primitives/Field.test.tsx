import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Fieldset, TextArea, TextField } from "./Field";
import { RadioCard } from "./RadioCard";

describe("TextField", () => {
  it("is labelled by its visible label", () => {
    render(<TextField label="YOUR NAME" placeholder="Who's stepping up?" />);
    const input = screen.getByLabelText("YOUR NAME");
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveClass("h-13", "bg-inset", "border-line-strong");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("links the error message", () => {
    render(<TextField label="EMAIL" error="Enter a valid email" />);
    const input = screen.getByLabelText("EMAIL");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const msg = screen.getByText("Enter a valid email");
    expect(input.getAttribute("aria-describedby")).toContain(msg.id);
  });

  it("links a hint", () => {
    render(<TextField label="EMAIL" hint="We reply within a day" />);
    const hint = screen.getByText("We reply within a day");
    expect(screen.getByLabelText("EMAIL").getAttribute("aria-describedby")).toContain(hint.id);
  });

  it("accepts typing", async () => {
    render(<TextField label="YOUR NAME" />);
    await userEvent.type(screen.getByLabelText("YOUR NAME"), "Rohit");
    expect(screen.getByLabelText("YOUR NAME")).toHaveValue("Rohit");
  });
});

describe("TextArea", () => {
  it("is a 110px non-resizable textarea", () => {
    render(<TextArea label="THE CHALLENGE" />);
    const ta = screen.getByLabelText("THE CHALLENGE");
    expect(ta.tagName).toBe("TEXTAREA");
    expect(ta).toHaveClass("h-27.5", "resize-none");
  });
});

describe("Fieldset + RadioCard", () => {
  it("groups radio cards under a legend and selects one", async () => {
    render(
      <Fieldset legend="CHOOSE YOUR FORMAT">
        <RadioCard
          name="format"
          value="sign"
          title="Sign a player"
          description="Full-time role"
          defaultChecked
        />
        <RadioCard name="format" value="doubles" title="Doubles" description="Project collab" />
      </Fieldset>,
    );
    const group = screen.getByRole("group", { name: "CHOOSE YOUR FORMAT" });
    expect(group).toBeInTheDocument();
    const doubles = screen.getByRole("radio", { name: /Doubles/ });
    await userEvent.click(doubles);
    expect(doubles).toBeChecked();
    expect(screen.getByRole("radio", { name: /Sign a player/ })).not.toBeChecked();
  });
});
