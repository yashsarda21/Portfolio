import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FacilityTile } from "./FacilityTile";
import { IndexRail, RailSection } from "./IndexRail";
import { RecordChip } from "./RecordChip";
import { VenueCard } from "./VenueCard";
import { VenueFixture } from "./VenueFixture";

const play = { label: "PLAY", href: "/play/tennis" };
const skip = { label: "SKIP", href: "/projects" };

describe("VenueCard", () => {
  const card = {
    scene: "court" as const,
    number: "VENUE 02",
    status: "UNPLAYED",
    name: "CENTRE COURT",
    blurb: "Return my serve.",
    reveals: "REVEALS · MATCH HIGHLIGHTS · ~12s",
    play,
    skip,
  };

  it("is an article with an h2 name, the status, and PLAY and SKIP links", () => {
    render(<VenueCard {...card} played={false} />);
    const article = screen.getByRole("article");
    expect(article).toHaveAttribute("data-state", "unplayed");
    expect(within(article).getByRole("heading", { level: 2, name: "CENTRE COURT" })).toBeVisible();
    expect(within(article).getByText("UNPLAYED")).toBeVisible();
    expect(within(article).getByText("VENUE 02")).toBeVisible();
    expect(within(article).getByRole("link", { name: "PLAY" })).toHaveAttribute(
      "href",
      "/play/tennis",
    );
    expect(within(article).getByRole("link", { name: "SKIP" })).toHaveAttribute(
      "href",
      "/projects",
    );
  });

  it("marks a played venue and offers the rematch", () => {
    render(
      <VenueCard
        {...card}
        played
        status="PLAYED · 14* NOT OUT"
        play={{ label: "REMATCH", href: "/play/cricket" }}
      />,
    );
    expect(screen.getByRole("article")).toHaveAttribute("data-state", "played");
    expect(screen.getByRole("link", { name: "REMATCH" })).toBeVisible();
  });

  it("hides the picture from assistive tech", () => {
    const { container } = render(<VenueCard {...card} played={false} />);
    const art = container.querySelector("[data-venue]");
    expect(art).toHaveAttribute("aria-hidden", "true");
  });

  it("takes the heading level, a slot class, and a ref for the tilt", () => {
    let tilted: HTMLElement | null = null;
    const { container } = render(
      <VenueCard
        {...card}
        played={false}
        headingLevel={3}
        slotClassName="[--arc-y:-14px]"
        tiltRef={(el) => {
          tilted = el;
        }}
      />,
    );
    expect(screen.getByRole("heading", { level: 3 })).toBeVisible();
    expect(container.firstElementChild).toHaveClass("venue-slot", "[--arc-y:-14px]");
    expect(tilted).toBe(screen.getByRole("article"));
  });

  it("takes the pointer handlers on the slot, not on the card that tilts", () => {
    let on: EventTarget | null = null;
    const { container } = render(
      <VenueCard
        {...card}
        played={false}
        slotProps={{
          onPointerDown: (e) => {
            on = e.currentTarget;
          },
        }}
      />,
    );
    fireEvent.pointerDown(screen.getByRole("article"));
    expect(on).toBe(container.firstElementChild);
  });
});

describe("VenueFixture", () => {
  const fixture = {
    scene: "turf" as const,
    meta: "VENUE 01 · CAREER",
    status: "14* NOT OUT",
    name: "CRICKET GROUND",
    play: { label: "REMATCH", href: "/play/cricket" },
    skip: { label: "SEE STATS", href: "/career" },
  };

  it("has an h2 name and two action links in a 2-column grid", () => {
    render(<VenueFixture {...fixture} played />);
    const article = screen.getByRole("article");
    expect(article).toHaveAttribute("data-state", "played");
    expect(
      within(article).getByRole("heading", { level: 2, name: "CRICKET GROUND" }),
    ).toBeVisible();
    const links = within(article).getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["REMATCH", "SEE STATS"]);
    expect(links[0]!.parentElement).toHaveClass("grid", "grid-cols-2");
    expect(links[1]!.parentElement).toBe(links[0]!.parentElement);
  });

  it("is unplayed unless told otherwise", () => {
    render(<VenueFixture {...fixture} played={false} />);
    expect(screen.getByRole("article")).toHaveAttribute("data-state", "unplayed");
  });
});

describe("IndexRail", () => {
  const links = [
    { key: "career", label: "Career Stats", tag: "SEEN", seen: true, href: "/career" },
    { key: "projects", label: "Match Highlights", tag: "PROJECTS", seen: false, href: "/p" },
  ];

  it("lists one link per entry in a named navigation", () => {
    render(<IndexRail label="Portfolio index" title="JUMP STRAIGHT TO" links={links} />);
    const nav = screen.getByRole("navigation", { name: "Portfolio index" });
    const items = within(nav).getAllByRole("link");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute("href", "/career");
    expect(items[0]).toHaveClass("min-h-11");
    expect(within(nav).getByText("JUMP STRAIGHT TO")).toBeVisible();
  });

  it("marks a seen entry's tag", () => {
    render(<IndexRail label="Portfolio index" title="JUMP" links={links} />);
    expect(screen.getByText("SEEN")).toHaveAttribute("data-seen");
    expect(screen.getByText("PROJECTS")).not.toHaveAttribute("data-seen");
  });

  it("puts the header and footer outside the navigation", () => {
    render(
      <IndexRail
        label="Portfolio index"
        title="JUMP"
        links={links}
        header={<RailSection label="MATCHDAY CARD">1 OF 3 VENUES</RailSection>}
        footer={
          <RailSection label="FULL TIME">
            The final whistle blows after all three venues.
          </RailSection>
        }
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Portfolio index" });
    for (const text of ["MATCHDAY CARD", "1 OF 3 VENUES", "FULL TIME"]) {
      expect(screen.getByText(text)).toBeVisible();
      expect(nav).not.toContainElement(screen.getByText(text));
    }
  });
});

describe("FacilityTile", () => {
  it("is a link named by its label and title", () => {
    render(
      <FacilityTile label="ACHIEVEMENTS" title="TROPHY ROOM" tone="glass" size="lg" href="/t" />,
    );
    const link = screen.getByRole("link", { name: /ACHIEVEMENTS.*TROPHY ROOM/ });
    expect(link).toHaveAttribute("href", "/t");
    expect(link).toHaveAttribute("data-tone", "glass");
  });

  it("carries its tone", () => {
    render(<FacilityTile label="CONTACT" title="TEAM UP" tone="volt" size="lg" href="/team" />);
    expect(screen.getByRole("link")).toHaveAttribute("data-tone", "volt");
  });
});

describe("RecordChip", () => {
  it("shows the label and the value and is not focusable", () => {
    render(<RecordChip label="YOUR RECORD" value="YASH 1 · YOU 0" />);
    const chip = screen.getByText("YOUR RECORD").closest("p")!;
    expect(chip).toHaveTextContent("YASH 1 · YOU 0");
    expect(chip).not.toHaveAttribute("tabindex");
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
