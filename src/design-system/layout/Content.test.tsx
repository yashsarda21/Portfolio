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
  const CRUMB = { hubLabel: "HUB", label: "Breadcrumb" } as const;

  it("is a nav named by its label, with an ordered list", () => {
    render(<Breadcrumb mark="YS" trail={trail} {...CRUMB} href="/arena" />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(nav).getByRole("list")).toBeInTheDocument();
    expect(nav.querySelector("ol")).not.toBeNull();
  });

  it("makes the first crumb (mark + HUB) the only link", () => {
    render(<Breadcrumb mark="YS" trail={trail} {...CRUMB} href="/arena" />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName(/HUB/);
    expect(links[0]).toHaveAttribute("href", "/arena");
  });

  it("marks the last crumb as the current page and hides the separators", () => {
    const { container } = render(<Breadcrumb mark="YS" trail={trail} {...CRUMB} href="/arena" />);
    const current = container.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("CAREER STATS");
    const seps = container.querySelectorAll("li[aria-hidden='true']");
    expect(seps).toHaveLength(trail.length);
    seps.forEach((s) => expect(s).toHaveTextContent("/"));
  });

  it("keeps every crumb in the page for assistive tech, even the ones that step aside on narrow screens", () => {
    render(<Breadcrumb mark="YS" trail={["A", "B", "C"]} {...CRUMB} href="/arena" />);
    for (const name of ["A", "B", "C"]) expect(screen.getByText(name)).toBeInTheDocument();
    expect(screen.getByText("C")).toHaveAttribute("aria-current", "page");
  });

  it("two crumbs with the same text still render both", () => {
    render(<Breadcrumb mark="YS" trail={["SAME", "SAME"]} {...CRUMB} href="/arena" />);
    expect(screen.getAllByText("SAME")).toHaveLength(2);
  });

  it("renders as a custom link element when asked", () => {
    render(
      <Breadcrumb
        mark="YS"
        trail={["X"]}
        as="button"
        type="button"
        label="Breadcrumb"
        hubLabel="HOME"
      />,
    );
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

  it("renders a muted video with controls, a named captions track and its text alternative", () => {
    const { container } = render(
      <MediaSlot
        label="Kudo board replay"
        badge="REPLAY"
        round="THE FINAL"
        describedBy="kudo-line kudo-par"
        media={{
          src: "/kudo.mp4",
          poster: "/kudo.png",
          captions: { src: "/kudo.vtt", label: "English", srcLang: "en" },
        }}
      />,
    );
    const video = container.querySelector("video")!;
    expect(video).not.toBeNull();
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("src", "/kudo.mp4");
    expect(video).toHaveAttribute("poster", "/kudo.png");
    expect(video).toHaveAttribute("preload", "metadata");
    expect(video).toHaveAttribute("aria-label", "Kudo board replay");
    expect(video).toHaveAttribute("aria-describedby", "kudo-line kudo-par");
    expect(video).not.toHaveAttribute("data-silent");
    const track = video.querySelector("track")!;
    expect(track).toHaveAttribute("kind", "captions");
    expect(track).toHaveAttribute("src", "/kudo.vtt");
    expect(track).toHaveAttribute("label", "English");
    expect(track).toHaveAttribute("srclang", "en");
  });

  it("renders no captions track when there are no captions (an empty track is invalid HTML)", () => {
    const { container } = render(
      <MediaSlot
        label="Kudo board replay"
        badge="REPLAY"
        round="THE FINAL"
        media={{ src: "/kudo.mp4", silent: true }}
      />,
    );
    expect(container.querySelector("video")).not.toBeNull();
    expect(container.querySelector("track")).toBeNull();
  });

  it("marks a silent recording so the one scoped axe exception can find it", () => {
    const { container } = render(
      <MediaSlot
        label="Kudo board replay"
        badge="REPLAY"
        round="THE FINAL"
        media={{ src: "/kudo.mp4", silent: true }}
      />,
    );
    expect(container.querySelector("video")).toHaveAttribute("data-silent");
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

describe("ProblemApproachResult id", () => {
  it("puts the id on the list so a video can be described by it", () => {
    const { container } = render(
      <ProblemApproachResult
        id="par-1"
        serve={{ label: "S", text: "p" }}
        rally={{ label: "R", text: "a" }}
        winner={{ label: "W", text: "r" }}
      />,
    );
    expect(container.querySelector("dl")).toHaveAttribute("id", "par-1");
  });
});

describe("PageTitle", () => {
  it("renders one h1 with the eyebrow and the aside", () => {
    render(<PageTitle eyebrow="THE SCORECARD" title="CAREER STATS" aside={<span>aside</span>} />);
    expect(screen.getByRole("heading", { level: 1, name: "CAREER STATS" })).toHaveClass("type-d1");
    expect(screen.getByText("THE SCORECARD")).toHaveClass("text-volt");
    expect(screen.getByText("aside")).toBeInTheDocument();
  });

  it("sets the 96px title and a line under it when asked", () => {
    render(
      <PageTitle eyebrow="CONTACT" title="TEAM UP" size="xl" lede="You've seen how I play." />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "TEAM UP" })).toHaveClass("type-d0");
    const lede = screen.getByText("You've seen how I play.");
    expect(lede.tagName).toBe("P");
    expect(lede).toHaveClass("type-body-intro", "text-text-2");
    // Reads in order: eyebrow, title, line.
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.compareDocumentPosition(lede) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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

  it("makes the title, panels and footer the main landmark, with the header and tab bar outside it", () => {
    render(
      <ContentLayout
        mainId="main"
        header={<header>head</header>}
        title={<h1>title</h1>}
        footer={<span>foot</span>}
        tabBar={<nav aria-label="Main">tabs</nav>}
      >
        <section>panels</section>
      </ContentLayout>,
    );
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main");
    for (const text of ["title", "panels", "foot"])
      expect(main).toContainElement(screen.getByText(text));
    for (const text of ["head", "tabs"]) expect(main).not.toContainElement(screen.getByText(text));
    expect(screen.getByRole("banner")).toHaveTextContent("head");
  });

  describe("with a stage and a rail", () => {
    const render3 = () =>
      render(
        <ContentLayout
          mainId="main"
          header={<header>head</header>}
          title={<h1>title</h1>}
          footer={<span>foot</span>}
          stage={<div>stage</div>}
          rail={<div>rail</div>}
        >
          <section>panels</section>
        </ContentLayout>,
      );

    it("keeps every part inside main, in reading order: title, panels, stage, rail, footer", () => {
      render3();
      const main = screen.getByRole("main");
      const texts = ["title", "panels", "stage", "rail", "foot"];
      for (const text of texts) expect(main).toContainElement(screen.getByText(text));
      const order = texts.map((t) => screen.getByText(t));
      for (let i = 1; i < order.length; i++)
        expect(
          order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    });

    it("is one grid from the tablet up, and the panels come last on the phone", () => {
      render3();
      const body = screen.getByText("title").parentElement!.parentElement!;
      expect(body).toHaveClass(
        "md:grid",
        "min-[1200px]:grid-cols-[minmax(0,26.25rem)_auto_minmax(0,26.25rem)]",
      );
      expect(screen.getByText("panels").parentElement).toHaveClass("max-md:order-last");
    });

    it("is the same flat layout without a stage", () => {
      render(
        <ContentLayout header={<header>head</header>} title={<h1>title</h1>}>
          <section>panels</section>
        </ContentLayout>,
      );
      expect(screen.getByText("title").parentElement).toHaveClass("px-9");
      expect(screen.getByText("title").parentElement).not.toHaveClass("md:col-start-1");
    });
  });

  describe("with a side column", () => {
    const renderSide = () =>
      render(
        <ContentLayout
          mainId="main"
          header={<header>head</header>}
          title={<h1>title</h1>}
          side={<aside>side</aside>}
        >
          <section>panels</section>
        </ContentLayout>,
      );

    it("keeps the title, panels and side inside main, in that reading order", () => {
      renderSide();
      const main = screen.getByRole("main");
      const order = ["title", "panels", "side"].map((t) => screen.getByText(t));
      for (const el of order) expect(main).toContainElement(el);
      for (let i = 1; i < order.length; i++)
        expect(
          order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    });

    it("is a two-column grid from 1200px, the side starting level with the panels (160px down)", () => {
      renderSide();
      const body = screen.getByText("title").parentElement!.parentElement!;
      expect(body).toHaveClass(
        "min-[1200px]:grid",
        "min-[1200px]:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]",
        "min-[1440px]:grid-cols-[minmax(0,1fr)_34rem]",
      );
      expect(screen.getByText("side").parentElement).toHaveClass(
        "min-[1200px]:col-start-2",
        "min-[1200px]:pt-40",
      );
    });

    it("leaves the flat layout alone without a side", () => {
      render(
        <ContentLayout header={<header>head</header>} title={<h1>title</h1>}>
          <section>panels</section>
        </ContentLayout>,
      );
      expect(screen.getByText("title").parentElement).toHaveClass("px-9");
      expect(screen.getByText("title").parentElement).not.toHaveClass("min-[1200px]:col-start-1");
    });
  });

  it("leaves the main landmark without an id unless asked", () => {
    render(
      <ContentLayout header={<header>head</header>} title={<h1>title</h1>}>
        <section>panels</section>
      </ContentLayout>,
    );
    expect(screen.getByRole("main")).not.toHaveAttribute("id");
  });

  it("without a footer the panels run to the 36px bottom gutter; with one the footer owns it", () => {
    const { rerender } = render(
      <ContentLayout header={<header>head</header>} title={<h1>title</h1>}>
        <section>panels</section>
      </ContentLayout>,
    );
    const panels = () => screen.getByText("panels").parentElement!;
    expect(panels()).toHaveClass("pb-9");
    expect(screen.getByRole("main").children).toHaveLength(2);
    rerender(
      <ContentLayout
        header={<header>head</header>}
        title={<h1>title</h1>}
        footer={<span>foot</span>}
      >
        <section>panels</section>
      </ContentLayout>,
    );
    expect(panels()).not.toHaveClass("pb-9");
    expect(screen.getByRole("main").children).toHaveLength(3);
  });
});
