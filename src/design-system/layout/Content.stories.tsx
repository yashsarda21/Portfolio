import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { BallByBall } from "../broadcast/BallByBall";
import { Breadcrumb } from "../broadcast/Breadcrumb";
import { HUD } from "../broadcast/HUD";
import { HUDButton } from "../broadcast/HUDButton";
import { MediaSlot } from "../broadcast/MediaSlot";
import { MobileTabBar } from "../broadcast/MobileTabBar";
import { ProblemApproachResult } from "../broadcast/ProblemApproachResult";
import { StatTile } from "../broadcast/StatTile";
import { Button } from "../primitives/Button";
import { Legend } from "../primitives/Legend";
import { LinkRow } from "../primitives/LinkRow";
import { SelectableList } from "../primitives/SelectableList";
import { PanelHeader } from "../primitives/PanelHeader";
import { MonoLabel, Text } from "../primitives/Text";
import { ContentLayout } from "./ContentLayout";
import { PageTitle } from "./PageTitle";

const meta: Meta = { title: "Layout/Content" };
export default meta;

// A 16x9 dark PNG as a data URI: no network, nothing external.
const POSTER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAIAAAC0SDtlAAAAE0lEQVR4nGPgE5EmCTGMahgUGgCKBCJR/fhs/AAAAABJRU5ErkJggg==";

const CRUMB = { hubLabel: "HUB", label: "Breadcrumb" } as const;

const TAB_ITEMS = [
  { key: "arena", label: "ARENA", icon: "arena", href: "#arena" },
  { key: "career", label: "CAREER", icon: "stats", href: "#career" },
  { key: "projects", label: "PROJECTS", icon: "play", href: "#projects" },
  { key: "skills", label: "SKILLS", icon: "list", href: "#skills" },
  { key: "team-up", label: "TEAM UP", icon: "plus-circle", href: "#team-up" },
] as const;

const INNINGS = [
  {
    id: "01",
    team: "DEUTSCHE BANK",
    role: "Software Engineer 1",
    span: "JUL 2024 – NOW",
    status: "NOT OUT",
  },
  {
    id: "02",
    team: "DEUTSCHE BANK",
    role: "Graduate Analyst Intern",
    span: "JUN – JUL 2023",
    status: "DEBUT",
  },
];

const REEL = [
  {
    id: "qf",
    round: "QUARTER-FINAL",
    name: "POWER BI DASHBOARD",
    kind: "Embedded analytics platform",
  },
  { id: "sf", round: "SEMI-FINAL", name: "KUDO BOARD", kind: "Deutsche Bank · built from scratch" },
  {
    id: "final",
    round: "THE FINAL",
    name: "AI INTERVIEW GROOMING PLATFORM",
    kind: "Published research",
  },
];

const ROW_COLUMNS =
  "grid grid-cols-[56px_minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_110px] gap-4 px-5.5";

export const SelectableScorecard: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState("01");
    return (
      <SelectableList.Root value={value} onValueChange={setValue} className="flex gap-6">
        <div className="w-200 glass">
          <PanelHeader size="lg" variant="mono-round" className={ROW_COLUMNS}>
            <span>INN</span>
            <span>TEAM</span>
            <span>ROLE</span>
            <span>SPAN</span>
            <span className="text-right">STATUS</span>
          </PanelHeader>
          <SelectableList.List label="Innings">
            {INNINGS.map((r) => (
              <SelectableList.Item key={r.id} value={r.id} className={cn("min-h-21", ROW_COLUMNS)}>
                <Text variant="d3" tone="dim" className="group-data-[state=active]/item:text-volt">
                  {r.id}
                </Text>
                <Text variant="d4s">{r.team}</Text>
                <Text variant="body-md" tone="secondary">
                  {r.role}
                </Text>
                <Text variant="mono-stack" tone="secondary" caps>
                  {r.span}
                </Text>
                <Text
                  variant="mono-tag"
                  tone={r.status === "NOT OUT" ? "volt" : undefined}
                  className="text-right"
                >
                  {r.status}
                </Text>
              </SelectableList.Item>
            ))}
          </SelectableList.List>
          {/* A link drawn as a row of the list: same look, but not a tab. */}
          <SelectableList.LinkRow href="#academy" className={cn("min-h-21", ROW_COLUMNS)}>
            <Text variant="d3" tone="dim">
              03
            </Text>
            <Text variant="d4s">PICT, PUNE</Text>
            <Text variant="body-md" tone="secondary">
              B.Tech IT
            </Text>
            <Text variant="mono-stack" tone="secondary" caps>
              2020 – 2024
            </Text>
            <Text variant="mono-tag" className="text-right">
              ACADEMY
            </Text>
          </SelectableList.LinkRow>
        </div>
        {INNINGS.map((r) => (
          <SelectableList.Panel key={r.id} value={r.id} className="flex-1 glass p-6">
            <MonoLabel
              variant="mono-label"
              tone="volt"
            >{`INNINGS ${r.id} · BALL BY BALL`}</MonoLabel>
          </SelectableList.Panel>
        ))}
      </SelectableList.Root>
    );
  },
};

export const SelectableReel: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState("final");
    return (
      <SelectableList.Root value={value} onValueChange={setValue} className="flex gap-6">
        <div className="w-75 glass">
          <PanelHeader>THE DRAW</PanelHeader>
          <SelectableList.List label="Projects">
            {REEL.map((p) => (
              <SelectableList.Item
                key={p.id}
                value={p.id}
                className="min-h-24 flex-col items-start gap-1 px-4.5 py-3.5"
              >
                <Text
                  variant="mono-round"
                  tone="dim"
                  className="group-data-[state=active]/item:text-volt"
                >
                  {p.round}
                </Text>
                <Text variant="draw-name">{p.name}</Text>
                <Text variant="caption" tone="label" leading="font">
                  {p.kind}
                </Text>
              </SelectableList.Item>
            ))}
          </SelectableList.List>
        </div>
        {REEL.map((p) => (
          <SelectableList.Panel key={p.id} value={p.id} className="flex-1 glass p-6">
            {p.name}
          </SelectableList.Panel>
        ))}
      </SelectableList.Root>
    );
  },
};

export const Breadcrumbs: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Breadcrumb mark="YS" trail={["ARENA HUB"]} {...CRUMB} href="#hub" />
      <Breadcrumb mark="YS" trail={["CRICKET GROUND", "CAREER STATS"]} {...CRUMB} href="#hub" />
      <Breadcrumb
        mark="YS"
        trail={["CENTRE COURT", "MATCH HIGHLIGHTS", "KUDO BOARD"]}
        {...CRUMB}
        href="#hub"
      />
    </div>
  ),
};

/** Fixed to the bottom of the viewport on mobile. A transform makes the story frame its containing block. */
function PhoneFrame({ current }: { current: string }) {
  return (
    <div className="relative h-32 w-97.5 max-w-full transform-gpu overflow-hidden border border-line bg-ground">
      <MobileTabBar
        label={`Main (${current})`}
        // md:grid: the bar is mobile-only, the story shows it at any width.
        className="md:grid"
        items={TAB_ITEMS.map((i) => ({ ...i, current: i.key === current }))}
      />
    </div>
  );
}

export const MobileTabBars: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6">
      {TAB_ITEMS.map((i) => (
        <PhoneFrame key={i.key} current={i.key} />
      ))}
    </div>
  ),
};

export const PageTitles: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-12">
      <PageTitle
        eyebrow="THE SCORECARD"
        title="CAREER STATS"
        aside={
          <>
            <StatTile label="PRO SINCE" value="JUL 2024" />
            <StatTile label="CLUB" value="DEUTSCHE" />
            <StatTile label="CURRENT" value="NOT OUT" tone="volt" />
          </>
        }
      />
      <PageTitle
        eyebrow="THE TOURNAMENT RUN · BEST PROJECT PLAYS THE FINAL"
        title="MATCH HIGHLIGHTS"
        aside={
          <MonoLabel variant="mono-meta" tone="label">
            3 OF 3 UNLOCKED
          </MonoLabel>
        }
      />
      <PageTitle
        eyebrow="SCOUTING NOTES"
        title="ATTRIBUTES"
        aside={
          <Legend
            items={[
              { label: "SHIPPED", swatch: "volt" },
              { label: "BUILT", swatch: "floodlight" },
              { label: "KIT BAG", swatch: "dim" },
            ]}
          />
        }
      />
      <div data-zone="trophy">
        <PageTitle eyebrow="THE CABINET" eyebrowTone="gold" title="TROPHY ROOM" />
      </div>
    </div>
  ),
};

export const LayoutSkeleton: StoryObj = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <ContentLayout
      header={
        <HUD
          className="max-md:h-11"
          left={
            <Breadcrumb
              mark="YS"
              trail={["CRICKET GROUND", "CAREER STATS"]}
              {...CRUMB}
              href="#hub"
            />
          }
          right={
            <HUDButton as="a" href="#scout">
              QUICK VIEW
            </HUDButton>
          }
        />
      }
      title={<PageTitle eyebrow="THE SCORECARD" title="CAREER STATS" />}
      footer={
        <>
          <MonoLabel variant="mono-comm" tone="volt" className="max-md:hidden">
            COMM
          </MonoLabel>
          <Button as="a" href="#next" size="s" skew="desktop" className="max-md:w-full">
            NEXT VENUE →
          </Button>
        </>
      }
      tabBar={
        <MobileTabBar
          label="Main"
          items={TAB_ITEMS.map((i) => ({ ...i, current: i.key === "career" }))}
        />
      }
    >
      <div className="grid flex-1 gap-6 lg:grid-cols-[800px_minmax(0,1fr)]">
        <section aria-label="Panel one" className="glass p-6 type-mono-label text-scout">
          PANEL ONE
        </section>
        <section aria-label="Panel two" className="glass p-6 type-mono-label text-scout">
          PANEL TWO
        </section>
      </div>
    </ContentLayout>
  ),
};

export const BallByBallList: StoryObj = {
  render: () => (
    <BallByBall
      className="w-100"
      items={[
        "Improving the sanctions compliance system that keeps restricted people and entities in line with each country’s law.",
        "Supporting 200+ country-specific sanctions lists for global regulatory adherence.",
        "Designed Excel bulk upload: 10,000+ records validated per upload across 50+ fields.",
      ]}
    />
  ),
};

export const ProblemApproachResults: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-8">
      <ProblemApproachResult
        className="w-180"
        serve={{
          label: "THE SERVE · PROBLEM",
          text: "Interview practice rarely feels real: no follow-up questions, no honest score.",
        }}
        rally={{
          label: "THE RALLY · APPROACH",
          text: "Gemini asks follow-ups based on your answers and evaluates them.",
        }}
        winner={{
          label: "THE WINNER · RESULT",
          text: "An end-of-interview score and feedback, and a published paper.",
        }}
      />
      <ProblemApproachResult
        className="w-90"
        serve={{ label: "THE SERVE · PROBLEM", text: "Narrow slot: the cells stack." }}
        rally={{ label: "THE RALLY · APPROACH", text: "Container query, not a viewport one." }}
        winner={{ label: "THE WINNER · RESULT", text: "Fits any column." }}
      />
    </div>
  ),
};

export const MediaSlots: StoryObj = {
  render: () => (
    <div className="flex w-180 flex-col gap-6">
      {/* No recording yet: the striped placeholder. */}
      <MediaSlot
        label="AI INTERVIEW GROOMING PLATFORM · REPLAY COMING SOON"
        badge="REPLAY"
        round="THE FINAL"
        media={null}
      />
      {/* A silent screen recording: no captions track; the text beside it is its text alternative. */}
      <MediaSlot
        label="Kudo Board · REPLAY"
        badge="REPLAY"
        round="SEMI-FINAL"
        describedBy="kudo-line"
        media={{ src: "replay-demo.mp4", poster: POSTER, silent: true }}
      />
      <p id="kudo-line" className="type-body-sm text-text-2">
        A recognition platform built from scratch for 10,000+ employees.
      </p>
      {/* A recording with sound carries a named captions track. */}
      <MediaSlot
        label="Power BI Dashboard · REPLAY"
        badge="REPLAY"
        round="QUARTER-FINAL"
        media={{
          src: "replay-demo.mp4",
          poster: POSTER,
          captions: { src: "replay-demo.vtt", label: "English", srcLang: "en" },
        }}
      />
    </div>
  ),
};

export const LinkRowTones: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="bg-volt p-6">
        <LinkRow href="#email" glyph="→">
          Email me (band)
        </LinkRow>
      </div>
      <div className="flex w-72 flex-col gap-2">
        <LinkRow tone="outline" href="#github" glyph="↗">
          CODE ON GITHUB
        </LinkRow>
        <LinkRow tone="outline" href="#demo" glyph="↗">
          LIVE DEMO
        </LinkRow>
        <LinkRow tone="primary" href="#case" glyph="→">
          FULL CASE STUDY
        </LinkRow>
      </div>
    </div>
  ),
};
