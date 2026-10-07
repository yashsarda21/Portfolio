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

  it("merges a caller aria-describedby with hint and error ids, caller first", () => {
    render(
      <TextField
        label="EMAIL"
        hint="We reply within a day"
        error="Enter a valid email"
        aria-describedby="extra-note"
      />,
    );
    const hint = screen.getByText("We reply within a day");
    const msg = screen.getByText("Enter a valid email");
    expect(screen.getByLabelText("EMAIL")).toHaveAttribute(
      "aria-describedby",
      `extra-note ${hint.id} ${msg.id}`,
    );
  });

  it("keeps a caller aria-describedby when there is no hint or error", () => {
    render(<TextArea label="NOTE" aria-describedby="extra-note" />);
    expect(screen.getByLabelText("NOTE")).toHaveAttribute("aria-describedby", "extra-note");
  });

  it("never lets rest props override aria-invalid", () => {
    render(<TextField label="EMAIL" error="Bad" aria-invalid={false} />);
    expect(screen.getByLabelText("EMAIL")).toHaveAttribute("aria-invalid", "true");
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
    const doubles = screen.getByRole("radio", { name: "Doubles" });
    await userEvent.click(doubles);
    expect(doubles).toBeChecked();
    expect(screen.getByRole("radio", { name: "Sign a player" })).not.toBeChecked();
  });

  it("draws a chosen card as the artboard does: volt border, 7% volt wash, 22px display title", () => {
    render(<RadioCard name="format" value="sign" title="Sign a player" description="Hiring" />);
    const card = screen.getByRole("radio").closest("label")!;
    expect(card).toHaveClass(
      "border-line-strong",
      "has-checked:border-volt",
      "has-checked:bg-volt-a07",
    );
    expect(screen.getByText("Sign a player")).toHaveClass("type-monogram");
    expect(screen.getByText("Hiring")).toHaveClass("leading-auto");
  });

  it("names the radio by its title only and describes it with the description", () => {
    render(
      <RadioCard name="format" value="doubles" title="Doubles" description="Project collab" />,
    );
    const radio = screen.getByRole("radio", { name: "Doubles" });
    expect(radio).toHaveAccessibleDescription("Project collab");
  });

  it("keeps a caller aria-describedby ahead of the description id", () => {
    render(
      <RadioCard
        name="format"
        value="doubles"
        title="Doubles"
        description="Project collab"
        aria-describedby="extra-note"
      />,
    );
    const ids = screen.getByRole("radio").getAttribute("aria-describedby")?.split(" ");
    expect(ids?.[0]).toBe("extra-note");
    expect(ids).toHaveLength(2);
  });

  it("dims and defaults the cursor when disabled", () => {
    render(<RadioCard name="format" value="x" title="Full" disabled />);
    const card = screen.getByRole("radio").closest("label");
    expect(card).toHaveClass("has-disabled:opacity-40", "has-disabled:cursor-default");
  });
});
