import type { Meta, StoryObj } from "@storybook/react-vite";
import portraitRest from "@/assets/portrait-rest.webp";
import { LiveDot } from "./LiveDot";
import { ScoreBug } from "./ScoreBug";
import { Scoreboard } from "./Scoreboard";

const meta: Meta = { title: "Broadcast/Boards" };
export default meta;

export const ScoreBugs: StoryObj = {
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <ScoreBug label="Yash 14 not out, ball 2 of 3">
        <ScoreBug.Name>YASH</ScoreBug.Name>
        <ScoreBug.Cell>14*</ScoreBug.Cell>
        <ScoreBug.Meta>BALL 2 OF 3</ScoreBug.Meta>
        <ScoreBug.Away>YOU BOWLING</ScoreBug.Away>
      </ScoreBug>
      <ScoreBug label="Yash serving, 40–30, rally 3">
        <ScoreBug.Name serving>YASH</ScoreBug.Name>
        <ScoreBug.Cell>40</ScoreBug.Cell>
        <ScoreBug.Cell muted>30</ScoreBug.Cell>
        <ScoreBug.Away tone="line">YOU</ScoreBug.Away>
        <ScoreBug.Status>RALLY 3</ScoreBug.Status>
      </ScoreBug>
      <ScoreBug label="Match point, 20–19">
        <ScoreBug.Name>YASH</ScoreBug.Name>
        <ScoreBug.Cell>20</ScoreBug.Cell>
        <ScoreBug.Cell muted>19</ScoreBug.Cell>
        <ScoreBug.Away tone="line">YOU</ScoreBug.Away>
        <ScoreBug.Status alert>MATCH POINT</ScoreBug.Status>
      </ScoreBug>
      <ScoreBug label="Yash 6 not out, you bowling, 2 of 3" size="sm">
        <ScoreBug.Name>YASH</ScoreBug.Name>
        <ScoreBug.Cell>6*</ScoreBug.Cell>
        <ScoreBug.Meta>YOU BOWLING · 2/3</ScoreBug.Meta>
      </ScoreBug>
    </div>
  ),
};

/** Cricket-Play artboard: YASH | 0* | BALL 1 OF 3 | YOU BOWLING. */
export const CricketExact: StoryObj = {
  render: () => (
    <ScoreBug label="Yash 0 not out, ball 1 of 3, you bowling">
      <ScoreBug.Name>YASH</ScoreBug.Name>
      <ScoreBug.Cell>0*</ScoreBug.Cell>
      <ScoreBug.Meta>BALL 1 OF 3</ScoreBug.Meta>
      <ScoreBug.Away>YOU BOWLING</ScoreBug.Away>
    </ScoreBug>
  ),
};

export const LandingScoreboard: StoryObj = {
  render: () => (
    <Scoreboard className="h-93.5 w-225.5">
      <Scoreboard.Header>
        <span className="flex items-center gap-2.5">
          <LiveDot pulse /> LIVE · THE ARENA
        </span>
        <span>PLAYER 01 / 01</span>
      </Scoreboard.Header>
      <Scoreboard.Body>
        <Scoreboard.Title>YASH SARDA</Scoreboard.Title>
        <Scoreboard.Subtitle>SOFTWARE ENGINEER</Scoreboard.Subtitle>
      </Scoreboard.Body>
      <Scoreboard.Footer>
        <Scoreboard.FooterCell label="HOME" value="YASH" />
        <Scoreboard.FooterCell label="STATUS" value="UNDEFEATED" tone="volt" align="center" />
        <Scoreboard.FooterCell label="AWAY" value="YOU?" tone="label" align="end" />
      </Scoreboard.Footer>
    </Scoreboard>
  ),
};

/** Mobile-Landing's board: header 38, stacked name, two footer cells, a 5px bezel. */
export const CompactScoreboard: StoryObj = {
  render: () => (
    <div className="w-97.5 p-4">
      <Scoreboard size="compact">
        <Scoreboard.Header>
          <span className="flex items-center gap-2">
            <LiveDot size={6} /> LIVE · THE ARENA
          </span>
          <span>01 / 01</span>
        </Scoreboard.Header>
        <Scoreboard.Body>
          <Scoreboard.Title>
            YASH
            <br />
            SARDA
          </Scoreboard.Title>
          <Scoreboard.Subtitle>SOFTWARE ENGINEER</Scoreboard.Subtitle>
        </Scoreboard.Body>
        <Scoreboard.Footer>
          <Scoreboard.FooterCell label="STATUS" value="UNDEFEATED" tone="volt" />
          <Scoreboard.FooterCell label="AWAY" value="YOU?" tone="label" align="end" />
        </Scoreboard.Footer>
      </Scoreboard>
    </div>
  ),
};

/** The Intro board: header 48 and footer 64 on the board's ground, the scan bar and both power rings at 1. */
export const IntroScoreboard: StoryObj = {
  render: () => (
    <div className="relative m-10 h-135 w-310 [&_[data-part=board-hit]]:opacity-100 [&_[data-part=board-on]]:opacity-100 [&_[data-part=scan]]:opacity-100">
      <Scoreboard size="intro" className="absolute inset-0">
        <Scoreboard.Header>
          <span className="flex items-center gap-2.5">
            <LiveDot /> LIVE · PLAYER INTRODUCTION
          </span>
          <span>THE ARENA · MATCHDAY</span>
        </Scoreboard.Header>
        <Scoreboard.Scan variant="bar" />
        <Scoreboard.Body className="items-start justify-start pt-37.5 pl-14">
          <Scoreboard.Title>YASH SARDA</Scoreboard.Title>
          <Scoreboard.Subtitle>SOFTWARE ENGINEER</Scoreboard.Subtitle>
        </Scoreboard.Body>
        <Scoreboard.Footer>
          <Scoreboard.FooterCell label="INTRODUCING" value="NO. 01" />
          <Scoreboard.FooterCell label="RECORD" value="99 – 1" align="center" />
          <Scoreboard.FooterCell label="STATUS" value="UNDEFEATED" tone="volt" align="end" />
        </Scoreboard.Footer>
      </Scoreboard>
      <Scoreboard.Power className="inset-0" />
    </div>
  ),
};

/** Main's scan band, sitting at 1 across a landing board. */
export const LandingScan: StoryObj = {
  render: () => (
    <Scoreboard className="h-60 w-225.5 [&_[data-part=scan]]:opacity-100">
      <Scoreboard.Scan variant="band" />
      <Scoreboard.Body>
        <Scoreboard.Subtitle>SOFTWARE ENGINEER</Scoreboard.Subtitle>
      </Scoreboard.Body>
    </Scoreboard>
  ),
};

/**
 * The Landing's boot presets on a board: header and footer fade, the scan band sweeps, the name and the
 * subtitle lock in (the subtitle starts at .7em and settles on its own .42em). Each part waits its --d.
 * `data-boot` marks the parts so a test can look at them before and after.
 */
export const BootPresets: StoryObj = {
  render: () => (
    <Scoreboard className="h-93.5 w-225.5">
      <Scoreboard.Scan variant="band" className="animate-boot-scan [--d:0.5s]" />
      <Scoreboard.Header className="animate-boot-fade [--d:0.2s]">
        <span>LIVE · THE ARENA</span>
        <span>PLAYER 01 / 01</span>
      </Scoreboard.Header>
      <Scoreboard.Body>
        <Scoreboard.Title data-boot="name" className="animate-boot-name [--d:0.3s]">
          YASH SARDA
        </Scoreboard.Title>
        <Scoreboard.Subtitle className="animate-boot-name [--boot-from:0.7em] [--d:0.9s]">
          SOFTWARE ENGINEER
        </Scoreboard.Subtitle>
      </Scoreboard.Body>
      <Scoreboard.Footer className="animate-boot-rise [--d:1.2s]">
        <Scoreboard.FooterCell label="HOME" value="YASH" />
        <Scoreboard.FooterCell label="STATUS" value="UNDEFEATED" tone="volt" align="center" />
        <Scoreboard.FooterCell label="AWAY" value="YOU?" tone="label" align="end" />
      </Scoreboard.Footer>
    </Scoreboard>
  ),
  play: () => {
    for (const animation of document.getAnimations()) animation.finish();
  },
};

/** The intro's idle loops: the figure breathes from its feet, and a light sweeps across the face. */
export const IntroLoops: StoryObj = {
  render: () => (
    <div className="relative h-112.75 w-140 bg-board">
      <div className="absolute inset-0 animate-breathe">
        <img src={portraitRest} alt="" className="size-full object-contain" />
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-face-sweep"
          style={{ "--mask": `url(${portraitRest})` } as React.CSSProperties}
        />
      </div>
    </div>
  ),
};
