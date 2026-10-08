import type { Meta, StoryObj } from "@storybook/react-vite";
import turnStrip from "@/assets/rig/turn_0.webp";
import { framePosition } from "@/lib/sprite";
import { LiveDot } from "../broadcast/LiveDot";
import { Scoreboard } from "../broadcast/Scoreboard";
import { ArenaBackdrop, type BootBeats } from "./ArenaBackdrop";
import { CrowdTier } from "./CrowdTier";
import { CONE_REGIONS } from "./cones";
import { Dust } from "./Dust";
import { FloodlightBank } from "./FloodlightBank";
import { SpriteStrip } from "./SpriteStrip";
import { VenueArt } from "./VenueArt";
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

/** Main's beats for the scene (seconds). The Landing page owns the real table; this is its copy for the story. */
const LANDING_BOOT: BootBeats = {
  crowd: 0.3,
  coneL: 1,
  coneR: 1.5,
  sky: 2.2,
  field: 2.4,
  pitch: 2.6,
  banks: [0.6, 1.1, 1.6, 2],
};

/** The Landing scene with the floodlight boot played to its end (every layer in, every bank flickered on). */
export const LandingBackdrop: StoryObj = {
  render: () => (
    <div className="relative h-225 w-360">
      <ArenaBackdrop boot={LANDING_BOOT} />
    </div>
  ),
  play: () => {
    for (const animation of document.getAnimations()) animation.finish();
  },
};

/** The Intro scene at rest: lower crowd and field, wider cones, flat banks lit (their flares at 0). */
export const IntroBackdrop: StoryObj = {
  render: () => (
    <div className="relative h-225 w-360">
      <ArenaBackdrop layout="intro" />
    </div>
  ),
};

/** Dust drifting in the Landing's two beams. Drawn on a wide screen only; here it shows on desktop. */
export const DustInBeams: StoryObj = {
  render: () => (
    <div className="relative h-225 w-360">
      <ArenaBackdrop dust />
    </div>
  ),
};

/** Dust alone, in the Intro's two beams (the cones drawn faintly for reference). */
export const DustAlone: StoryObj = {
  render: () => (
    <div className="relative h-225 w-360 bg-night">
      <Dust regions={CONE_REGIONS.intro} count={120} />
    </div>
  ),
};

/** The flat banks of the Intro, with their flares pushed to 1 (a timeline tweens them from 0). */
export const FlatBanksWithFlare: StoryObj = {
  render: () => (
    <div className="relative h-60 w-160 overflow-hidden bg-night [&_[data-part=flare]]:opacity-100">
      <FloodlightBank size="lg" flat flare className="top-12 left-20" />
      <FloodlightBank size="sm" flat flare className="top-12 left-80" />
    </div>
  ),
};

/** A sprite strip scaled to its box, parked on frame 7 of 16. */
export const SpriteFrame: StoryObj = {
  render: () => (
    <SpriteStrip
      src={turnStrip}
      data-frame="7"
      className="h-112.75 w-140"
      style={{ backgroundPosition: framePosition(7, 16) }}
    />
  ),
};

/** The Hub's scene alone (sky, volt floor glow, crowd strip, grid floor), compared to Hub@1440x900 with every box of UI masked. */
export const HubBackdrop: StoryObj = {
  render: () => (
    <div className="relative h-225 w-360">
      <ArenaBackdrop layout="hub" />
    </div>
  ),
};

/** The three venue pictures at the width of a Hub card's art (348px): cricket, tennis and badminton. */
export const VenueArts: StoryObj = {
  render: () => (
    <div className="flex w-360 gap-7 bg-ground p-7">
      {(["turf", "court", "hall"] as const).map((scene) => (
        <VenueArt key={scene} scene={scene} className="w-87" />
      ))}
    </div>
  ),
};
