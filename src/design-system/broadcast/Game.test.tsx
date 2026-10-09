import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AimZone } from "./AimZone";
import { AttributeToast } from "./AttributeToast";
import { BallTracker } from "./BallTracker";
import { CallOverlay } from "./CallOverlay";
import { CourtsideCard } from "./CourtsideCard";
import { LEDMarquee } from "./LEDMarquee";
import { PowerMeter } from "./PowerMeter";
import { RevealChip, RevealList } from "./RevealList";
import { ScoreBug } from "./ScoreBug";
import { TimingMeter } from "./TimingMeter";

describe("AimZone", () => {
  it("is a button named by `name` whose text is `label`", () => {
    render(<AimZone label="← LEFT" name="Return to the left" open={false} onPick={() => {}} />);
    const button = screen.getByRole("button", { name: "Return to the left" });
    expect(button).toHaveTextContent("← LEFT");
    expect(button).toHaveAttribute("data-state", "idle");
  });

  it("open sets data-state=open", () => {
    render(<AimZone label="OPEN COURT →" name="Return right" open onPick={() => {}} />);
    expect(screen.getByRole("button")).toHaveAttribute("data-state", "open");
  });

  it("a click calls onPick; disabled does not", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    const { rerender } = render(<AimZone label="L" name="Left" open={false} onPick={onPick} />);
    await user.click(screen.getByRole("button", { name: "Left" }));
    expect(onPick).toHaveBeenCalledTimes(1);
    rerender(<AimZone label="L" name="Left" open={false} disabled onPick={onPick} />);
    await user.click(screen.getByRole("button", { name: "Left" }));
    expect(onPick).toHaveBeenCalledTimes(1);
  });
});

describe("AimZone tabbable", () => {
  it("tabbable={false} leaves the tab order but still takes a tap", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<AimZone label="L" name="Left" open={false} tabbable={false} onPick={onPick} />);
    const button = screen.getByRole("button", { name: "Left" });
    expect(button).toHaveAttribute("tabindex", "-1");
    await user.click(button);
    expect(onPick).toHaveBeenCalledTimes(1);
  });
});

describe("RevealList", () => {
  const slots = [
    { state: "open", eyebrow: "INNINGS 01 · NOT OUT", title: "DEUTSCHE BANK", meta: "SE1 · now" },
    { state: "locked", label: "INNINGS 02 · LOCKED", hint: "BOWL BALL 2" },
  ] as const;

  it("shows open slots as eyebrow / title / meta and locked slots as label / hint", () => {
    render(<RevealList title="STADIUM SCREEN" count="1 / 3 UNLOCKED" slots={slots} />);
    for (const text of [
      "STADIUM SCREEN",
      "1 / 3 UNLOCKED",
      "INNINGS 01 · NOT OUT",
      "DEUTSCHE BANK",
      "SE1 · now",
      "INNINGS 02 · LOCKED",
      "BOWL BALL 2",
    ]) {
      expect(screen.getByText(text)).toBeVisible();
    }
    expect(screen.getAllByRole("listitem").map((li) => li.getAttribute("data-state"))).toEqual([
      "open",
      "locked",
    ]);
  });

  it("is real content: nothing in the panel is aria-hidden", () => {
    const { container } = render(<RevealList title="STADIUM SCREEN" count="1 / 3" slots={slots} />);
    expect(container.querySelector("[aria-hidden]")).toBeNull();
  });

  it("RevealChip is real text too", () => {
    const { container } = render(
      <RevealChip eyebrow="INNINGS 01 UNLOCKED" title="DEUTSCHE BANK" meta="SE1 · now" />,
    );
    expect(screen.getByText("DEUTSCHE BANK")).toBeVisible();
    expect(container.querySelector("[aria-hidden]")).toBeNull();
  });
});

describe("TimingMeter", () => {
  const zones: { good: [number, number]; perfect: [number, number] } = {
    good: [38, 62],
    perfect: [46.5, 53.5],
  };

  it("draws the zones where the props say", () => {
    const { container } = render(<TimingMeter zones={zones} size="stage" />);
    const perfect = container.querySelector<HTMLElement>("[data-part='perfect']")!;
    expect(perfect.style.left).toBe("46.5%");
    expect(perfect.style.width).toBe("7%");
    const good = container.querySelector<HTMLElement>("[data-part='good']")!;
    expect(good.style.left).toBe("38%");
    expect(good.style.width).toBe("24%");
  });

  it("moves the cursor layer by transform from --meter, and is hidden from assistive tech", () => {
    const { container } = render(<TimingMeter zones={zones} size="column" />);
    const cursor = container.querySelector<HTMLElement>("[data-part='cursor']")!;
    expect(cursor.style.transform).toContain("var(--meter");
    expect(cursor.style.transform).toContain("translateX");
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("the stage shows its labels, the column does not", () => {
    const labels = { start: "SHORT", target: "YORKER", end: "FULL TOSS" };
    const { rerender } = render(<TimingMeter zones={zones} size="stage" labels={labels} />);
    expect(screen.getByText("YORKER")).toBeInTheDocument();
    rerender(<TimingMeter zones={zones} size="column" labels={labels} />);
    expect(screen.queryByText("YORKER")).toBeNull();
  });
});

describe("PowerMeter", () => {
  const legend = [
    { name: "SMASH", note: ["Top 20%. Fast,", "but he reads it."], tone: "volt" },
    { name: "CLEAR", note: ["Push him", "to the back line."], tone: "floodlight" },
    { name: "DROP", note: ["Soft. Risky.", "Very satisfying."], tone: "scout" },
  ] as const;

  it("scales the fill from the bottom by --power and is hidden from assistive tech", () => {
    const { container } = render(
      <PowerMeter zones={{ smashFrom: 80, dividerAt: 40 }} legend={legend} size="stage" />,
    );
    const fill = container.querySelector<HTMLElement>("[data-part='fill']")!;
    expect(fill.style.transform).toContain("scaleY(var(--power");
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("puts the smash zone on top and the divider where the shots split", () => {
    const { container } = render(
      <PowerMeter zones={{ smashFrom: 80, dividerAt: 40 }} legend={legend} size="stage" />,
    );
    expect(container.querySelector<HTMLElement>("[data-part='smash']")!.style.height).toBe("20%");
    expect(container.querySelector<HTMLElement>("[data-part='divider']")!.style.top).toBe("60%");
    expect(screen.getByText("CLEAR")).toBeInTheDocument();
  });

  it("the column is the track only", () => {
    render(<PowerMeter zones={{ smashFrom: 80, dividerAt: 40 }} legend={legend} size="column" />);
    expect(screen.queryByText("SMASH")).toBeNull();
  });
});

describe("BallTracker", () => {
  it("maps the four states to four data-states", () => {
    render(
      <BallTracker
        balls={[
          { label: "•", state: "for" },
          { label: "4", state: "against" },
          { label: "3", state: "current" },
          { label: "4", state: "pending" },
        ]}
      />,
    );
    const cells = ["•", "3"].map((t) => screen.getByText(t));
    expect(cells.map((c) => c.getAttribute("data-state"))).toEqual(["for", "current"]);
    expect(screen.getAllByText("4").map((c) => c.getAttribute("data-state"))).toEqual([
      "against",
      "pending",
    ]);
  });
});

describe("CallOverlay", () => {
  it("is hidden from assistive tech (the announcer speaks) and carries its tone", () => {
    render(<CallOverlay call="SIX." tone="floodlight" size="stage" className="extra" />);
    const call = screen.getByText("SIX.");
    expect(call).toHaveAttribute("aria-hidden", "true");
    expect(call).toHaveAttribute("data-tone", "floodlight");
    expect(call).toHaveClass("extra");
  });
});

describe("CourtsideCard", () => {
  it("is real text, tilted away from its outer edge", () => {
    const { container } = render(
      <CourtsideCard
        eyebrow="HIGHLIGHT 01 · QF"
        tag="RALLY 1"
        title="POWER BI DASHBOARD"
        line="Interactive reports."
        media="[SCREEN RECORDING]"
        side="right"
      />,
    );
    expect(screen.getByText("POWER BI DASHBOARD")).toBeVisible();
    expect(screen.getByText("[SCREEN RECORDING]")).toBeVisible();
    expect(container.querySelector("[data-side='right']")).not.toBeNull();
    expect(container.querySelector("[aria-hidden]")).toBeNull();
  });
});

describe("AttributeToast", () => {
  it("charged shows eyebrow, tag, title and a chip per skill", () => {
    render(
      <AttributeToast
        state="charged"
        eyebrow="ATTRIBUTE CHARGED · RALLY 1"
        tag="SMASH"
        title="BACKEND"
        chips={["Java", "Spring Boot", "JUnit"]}
        accent
      />,
    );
    expect(screen.getByText("BACKEND")).toBeVisible();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("ATTRIBUTE CHARGED · RALLY 1").closest("[data-state]")).toHaveAttribute(
      "data-accent",
    );
  });

  it("next and later are quiet dashed rows with a label and a hint", () => {
    render(
      <>
        <AttributeToast state="next" label="DATA" hint="UP NEXT · RALLY 3" />
        <AttributeToast state="later" label="CRAFT" hint="RALLY 4" />
      </>,
    );
    expect(screen.getByText("UP NEXT · RALLY 3").closest("[data-state]")).toHaveAttribute(
      "data-state",
      "next",
    );
    expect(screen.getByText("CRAFT").closest("[data-state]")).toHaveAttribute(
      "data-state",
      "later",
    );
  });
});

describe("LEDMarquee", () => {
  const items = [
    { text: "MATCH HIGHLIGHTS · 2 / 3 UNLOCKED", tone: "volt" },
    { text: "CENTRE COURT", tone: "floodlight" },
  ] as const;

  it("repeats its items twice for a seamless loop and is hidden from assistive tech", () => {
    const { container } = render(<LEDMarquee items={items} />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll("[data-part='item']")).toHaveLength(4);
  });
});

describe("ScoreBug.Cell pad", () => {
  it("is wide (16px) by default and tight (14px) on request", () => {
    render(
      <ScoreBug label="Score">
        <ScoreBug.Cell>40</ScoreBug.Cell>
        <ScoreBug.Cell pad="tight">30</ScoreBug.Cell>
      </ScoreBug>,
    );
    expect(screen.getByText("40")).toHaveClass("px-4");
    expect(screen.getByText("30")).toHaveClass("px-3.5");
    expect(screen.getByText("30")).not.toHaveClass("px-4");
  });
});
