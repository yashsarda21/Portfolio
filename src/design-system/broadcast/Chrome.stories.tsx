import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { AudioToggle } from "./AudioToggle";
import { BrandLockup } from "./BrandLockup";
import { CommentaryBar } from "./CommentaryBar";
import { HUD } from "./HUD";
import { HUDButton } from "./HUDButton";
import { KeyboardHint } from "./KeyboardHint";
import { LiveDot } from "./LiveDot";
import { PlayerTag } from "./PlayerTag";
import { SkipChip } from "./SkipChip";

const meta: Meta = { title: "Broadcast/Chrome" };
export default meta;

function Audio({ variant }: { variant: "labelled" | "icon" }) {
  const [on, setOn] = useState(true);
  return (
    <AudioToggle
      name="Crowd audio"
      variant={variant}
      on={on}
      onToggle={() => setOn(!on)}
      label="CROWD"
      stateOn="ON"
      stateOff="OFF"
    />
  );
}

export const GameHUD: StoryObj = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="relative h-40 bg-night">
      <HUD
        fade
        left={<BrandLockup as="a" href="#hub" mark="YS" label="HUB / CRICKET GROUND" />}
        center={<span className="type-mono-tag text-scout">[score bug]</span>}
        right={
          <>
            <HUDButton as="a" href="#scout">
              QUICK VIEW
            </HUDButton>
            <Audio variant="icon" />
          </>
        }
      />
    </div>
  ),
};

export const LandingHUD: StoryObj = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="relative h-40 bg-night">
      <HUD
        left={<BrandLockup mark="YS" label="THE ARENA" />}
        right={
          <>
            <Audio variant="labelled" />
            <HUDButton>SKIP INTRO</HUDButton>
          </>
        }
      />
    </div>
  ),
};

export const Pieces: StoryObj = {
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <div className="flex items-center gap-4">
        <LiveDot /> <LiveDot size={6} pulse /> <LiveDot size={10} />
        <BrandLockup mark="YS" size="md" label="SCOUTING REPORT" />
        <BrandLockup mark="YS" size="sm" />
      </div>
      <PlayerTag>YASH · ON STRIKE · 14*</PlayerTag>
      <div className="flex gap-3">
        <SkipChip href="#career">SKIP TO CAREER STATS</SkipChip>
        <SkipChip href="#career" variant="hub">
          SKIP
        </SkipChip>
      </div>
      <CommentaryBar tag="COMM" line="New challenger enters the arena." />
      <CommentaryBar tag="COMM" line="Exit state: the line has faded out." state="out" />
      <CommentaryBar tag="COMM" variant="inline" line="Challenge received. I'll serve first." />
      <KeyboardHint>ENTER ↵ TO PLAY · Q FOR QUICK VIEW</KeyboardHint>
    </div>
  ),
};
