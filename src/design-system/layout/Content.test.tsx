import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BallByBall } from "../broadcast/BallByBall";
import { Breadcrumb } from "../broadcast/Breadcrumb";
import { MediaSlot } from "../broadcast/MediaSlot";
import { MobileTabBar } from "../broadcast/MobileTabBar";
import { ProblemApproachResult } from "../broadcast/ProblemApproachResult";
import { ContentLayout } from "./ContentLayout";
import { PageTitle } from "./PageTitle";

describe("Breadcrumb", () => {
  const trail = ["CRICKET GROUND", "CAREER STATS"];

  it("is a nav named by its label, with an ordered list", () => {
    render(<Breadcrumb mark="YS" trail={trail} label="Breadcrumb" href="/arena" />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(nav).getByRole("list")).toBeInTheDocument();
    expect(nav.querySelector("ol")).not.toBeNull();
  });

  it("makes the first crumb (mark + HUB) the only link", () => {
    render(<Breadcrumb mark="YS" trail={trail} href="/arena" />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName(/HUB/);
    expect(links[0]).toHaveAttribute("href", "/arena");
  });

  it("marks the last crumb as the current page and hides the separators", () => {
    const { container } = render(<Breadcrumb mark="YS" trail={trail} href="/arena" />);
    const current = container.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("CAREER STATS");
    const seps = container.querySelectorAll("li[aria-hidden='true']");
    expect(seps).toHaveLength(trail.length);
    seps.forEach((s) => expect(s).toHaveTextContent("/"));
  });

  it("renders as a custom link element when asked", () => {
    render(<Breadcrumb mark="YS" trail={["X"]} as="button" type="button" hubLabel="HOME" />);
    expect(screen.getByRole("button", { name: /HOME/ })).toBeInTheDocument();
  });
});

describe("MobileTabBar", () => {
  const items = [
    { key: "arena", label: "ARENA", icon: "arena", href: "/arena" },
    { key: "career", label: "CAREER", icon: "stats", href: "/career", current: true },
    { key: "projects", label: "PROJECTS", icon: "play", href: "/highlights" },
  ] as const;

  it("is a nav with the current item marked and the others not", () => {
    render(<MobileTabBar label="Main" items={[...items]} />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav).toHaveAttribute("data-bottom-actions");
    expect(screen.getByRole("link", { name: "CAREER" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "ARENA" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "PROJECTS" })).not.toHaveAttribute("aria-current");
  });

  it("uses a custom link component with `to`", () => {
    render(
      <MobileTabBar
        label="Main"
        items={[
          {
            key: "a",
            label: "ARENA",
            icon: "arena",
            as: (p: { to: string; children?: React.ReactNode }) => <a href={p.to}>{p.children}</a>,
            to: "/x",
          },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "ARENA" })).toHaveAttribute("href", "/x");
  });
});

describe("MediaSlot", () => {
  it("shows the placeholder label and no video when there is no media", () => {
    const { container } = render(
      <MediaSlot
        label="[KUDO BOARD · ADD A 10s SCREEN RECORDING]"
        badge="REPLAY"
        round="THE FINAL"
        media={null}
      />,
    );
    expect(screen.getByText("[KUDO BOARD · ADD A 10s SCREEN RECORDING]")).toBeVisible();
    expect(container.querySelector("video")).toBeNull();
  });

  it("renders a muted video with controls and a captions track when media is set", () => {
    const { container } = render(
      <MediaSlot
        label="Kudo board replay"
        badge="REPLAY"
        round="THE FINAL"
        media={{ src: "/kudo.mp4", captions: "/kudo.vtt", poster: "/kudo.png" }}
      />,
    );
    const video = container.querySelector("video")!;
    expect(video).not.toBeNull();
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("src", "/kudo.mp4");
    expect(video).toHaveAttribute("poster", "/kudo.png");
    expect(video).toHaveAttribute("preload", "metadata");
    const track = video.querySelector("track")!;
    expect(track).toHaveAttribute("kind", "captions");
    expect(track).toHaveAttribute("src", "/kudo.vtt");
  });
});

describe("BallByBall", () => {
  it("is an ordered list numbered 0.1, 0.2, …", () => {
    render(<BallByBall items={["First ball", "Second ball", "Third ball"]} />);
    const list = screen.getByRole("list");
    expect(list.tagName).toBe("OL");
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("0.1");
    expect(rows[0]).toHaveTextContent("First ball");
    expect(rows[2]).toHaveTextContent("0.3");
  });
});

describe("ProblemApproachResult", () => {
  it("lists the three cells with their labels and the winner in volt", () => {
    render(
      <ProblemApproachResult
        serve={{ label: "THE SERVE · PROBLEM", text: "p" }}
        rally={{ label: "THE RALLY · APPROACH", text: "a" }}
        winner={{ label: "THE WINNER · RESULT", text: "r" }}
      />,
    );
    expect(screen.getByText("THE SERVE · PROBLEM")).toBeInTheDocument();
    expect(screen.getByText("THE WINNER · RESULT")).toHaveClass("text-volt");
    expect(screen.getByText("r").closest("div")).toHaveClass("bg-volt-a08", "border-volt-a35");
  });
});

describe("PageTitle", () => {
  it("renders one h1 with the eyebrow and the aside", () => {
    render(<PageTitle eyebrow="THE SCORECARD" title="CAREER STATS" aside={<span>aside</span>} />);
    expect(screen.getByRole("heading", { level: 1, name: "CAREER STATS" })).toHaveClass(
      "type-title-page",
    );
    expect(screen.getByText("THE SCORECARD")).toHaveClass("text-volt");
    expect(screen.getByText("aside")).toBeInTheDocument();
  });

  it("uses the gold eyebrow tone when asked", () => {
    render(<PageTitle eyebrow="HALL" eyebrowTone="gold" title="TROPHY ROOM" />);
    expect(screen.getByText("HALL")).toHaveClass("text-gold");
  });
});

describe("ContentLayout", () => {
  it("renders every slot", () => {
    render(
      <ContentLayout
        header={<header>head</header>}
        title={<h1>title</h1>}
        footer={<span>foot</span>}
        tabBar={<nav aria-label="Main">tabs</nav>}
        backdrop={<i data-testid="bd" />}
      >
        <section>panels</section>
      </ContentLayout>,
    );
    for (const text of ["head", "title", "panels", "foot", "tabs"]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    expect(screen.getByTestId("bd").parentElement).toHaveAttribute("aria-hidden", "true");
  });
});
