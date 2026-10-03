import type { Meta, StoryObj } from "@storybook/react-vite";
import { LiveDot } from "../broadcast/LiveDot";
import { Scoreboard } from "../broadcast/Scoreboard";
import { ArenaBackdrop } from "./ArenaBackdrop";
import { CrowdTier } from "./CrowdTier";
import { FloodlightBank } from "./FloodlightBank";
import { VenueGlow } from "./VenueGlow";

const meta: Meta = { title: "Scene/Stadium", parameters: { layout: "fullscreen" } };
export default meta;

/** The Landing stadium + scoreboard at artboard positions, compared to Main@1440x900. */
export const LandingFidelity: StoryObj = {
  render: () => (
    <div className="relative h-225 w-360">
      <ArenaBackdrop />
      <Scoreboard className="absolute top-35 left-67.5 h-93.5 w-225.5">
        <Scoreboard.Header>
          <span className="flex items-center gap-2.5">
            <LiveDot /> LIVE · THE ARENA
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
    </div>
  ),
};

/** Same markup re-tinted by venue attribute. */
export const Venues: StoryObj = {
  render: () => (
    <div className="grid grid-cols-3">
      {(["turf", "court", "hall"] as const).map((venue) => (
        <div key={venue} data-venue={venue} className="relative h-100 overflow-hidden bg-ground">
          <VenueGlow y="100%" alpha={0.5} />
          <CrowdTier className="inset-x-0 top-10 h-40" alpha={0.3} />
          <FloodlightBank size="mini" className="top-4 left-10" />
          <FloodlightBank size="mini" on={false} className="top-4 right-10" />
          <span className="absolute bottom-4 left-4 type-mono-label text-scout">{venue}</span>
        </div>
      ))}
    </div>
  ),
};
