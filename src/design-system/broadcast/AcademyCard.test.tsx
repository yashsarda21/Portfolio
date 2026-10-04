import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AcademyCard } from "./AcademyCard";

const PROPS = {
  eyebrow: "EDUCATION",
  aside: "WHERE THE FUNDAMENTALS CAME FROM",
  title: "TRAINING ACADEMY",
  monogram: "PICT",
  name: "Pune Institute of Computer Technology",
  degree: "B.Tech, Information Technology",
  meta: "JUL 2020 – JUN 2024 · CGPA 8.94 · DISTINCTION",
  extrasLabel: "EXTRA DRILLS",
  extras: ["Published paper: AI-Enhanced Interview Grooming Platform", "MHT-CET 99.5 percentile"],
} as const;

describe("AcademyCard", () => {
  it("is a named section with the given id", () => {
    const { container } = render(<AcademyCard {...PROPS} id="academy" />);
    const section = screen.getByRole("region", { name: "TRAINING ACADEMY" });
    expect(section).toHaveAttribute("id", "academy");
    expect(container.firstElementChild).toBe(section);
  });

  it("draws the title as an h2 by default and takes any level", () => {
    const { rerender } = render(<AcademyCard {...PROPS} />);
    expect(screen.getByRole("heading", { level: 2, name: "TRAINING ACADEMY" })).toBeInTheDocument();
    rerender(<AcademyCard {...PROPS} headingLevel={3} />);
    expect(screen.getByRole("heading", { level: 3, name: "TRAINING ACADEMY" })).toBeInTheDocument();
  });

  it("shows the school, degree, meta line, eyebrow and aside", () => {
    render(<AcademyCard {...PROPS} />);
    for (const text of [PROPS.eyebrow, PROPS.aside, PROPS.name, PROPS.degree, PROPS.meta]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });

  it("sets the meta line in capitals, whatever case the content is stored in", () => {
    render(<AcademyCard {...PROPS} meta="Jul 2020 – Jun 2024 · CGPA 8.94 · Distinction, SPPU" />);
    expect(screen.getByText(/Jul 2020/)).toHaveClass("uppercase");
  });

  it("hides the monogram: the school's name already says it", () => {
    render(<AcademyCard {...PROPS} />);
    expect(screen.getByText("PICT").closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("lists the extras under their label", () => {
    render(<AcademyCard {...PROPS} />);
    const list = screen.getByRole("list", { name: "EXTRA DRILLS" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(within(list).getByText(/Published paper/)).toBeInTheDocument();
  });

  it("leaves the extras block out when there are none", () => {
    render(<AcademyCard {...PROPS} extras={[]} />);
    expect(screen.queryByText("EXTRA DRILLS")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("merges className and forwards a ref", () => {
    let node: HTMLElement | null = null;
    const { container } = render(
      <AcademyCard
        {...PROPS}
        className="h-full"
        ref={(el) => {
          node = el;
        }}
      />,
    );
    expect(container.firstElementChild).toHaveClass("h-full");
    expect(node).toBe(container.firstElementChild);
  });
});
