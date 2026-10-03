import type { Meta, StoryObj } from "@storybook/react-vite";
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
