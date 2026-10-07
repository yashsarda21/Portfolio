import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import portrait from "@/assets/portrait-rest.webp";
import { LinkRow } from "../primitives/LinkRow";
import { Text } from "../primitives/Text";
import { ActionRow } from "./ActionRow";
import { ChannelCard } from "./ChannelCard";
import { PlayerCard } from "./PlayerCard";

const meta: Meta = { title: "Broadcast/Card" };
export default meta;

const STATS = [
  { label: "PROBLEMS", value: "750+", accent: true },
  { label: "CGPA", value: "8.94", accent: true },
  { label: "CET %ILE", value: "99.5", accent: true },
  { label: "LISTS", value: "200+" },
  { label: "RECORDS", value: "10K+" },
  { label: "TESTS", value: "75+" },
];

const FRONT = (
  <>
    <PlayerCard.Header
      position={{ value: "SE", label: "POSITION" }}
      mark="YS"
      season="SEASON 2026"
    />
    <PlayerCard.Portrait src={portrait} alt="Yash Sarda" />
    <PlayerCard.Name name="YASH SARDA" line="SOFTWARE ENGINEER · DEUTSCHE BANK" />
    <PlayerCard.Stats stats={STATS} />
    <PlayerCard.Footer left="THE ARENA · NO. 01" right="RECORD 99–1" />
  </>
);

const SECTIONS = [
  "CAREER STATS",
  "MATCH HIGHLIGHTS",
  "PLAYER ATTRIBUTES",
  "TROPHY ROOM",
  "TEAM UP",
];

const BACK = (
  <>
    <div className="flex flex-col gap-4 px-6 pt-6">
      <Text variant="d3" tone="volt">
        THE FULL SHEET
      </Text>
      <ul className="flex flex-col gap-2.5">
        {SECTIONS.map((s) => (
          <li key={s} className="flex flex-col">
            <LinkRow href={`#${s}`} tone="outline" glyph="→">
              {s}
            </LinkRow>
          </li>
        ))}
      </ul>
    </div>
    <PlayerCard.Footer left="THE ARENA · NO. 01" right="RECORD 99–1" />
  </>
);

const noop = () => {};
const FLIP = { toBack: "Flip card: show the back", toFront: "Flip card: show the front" };

/** The front face, still (no float), as drawn on Player-Card at 400x640 plus its 1px border. */
export const Front: StoryObj = {
  render: () => (
    <PlayerCard
      flipped={false}
      onFlip={noop}
      label={FLIP.toBack}
      float={false}
      front={FRONT}
      back={BACK}
    />
  ),
};

/** The back face, still. Its links are real links outside any button; the front is inert while this shows. */
export const Back: StoryObj = {
  render: () => (
    <PlayerCard
      flipped
      onFlip={noop}
      label={FLIP.toFront}
      float={false}
      front={FRONT}
      back={BACK}
    />
  ),
};

function Interactive({ float = true }: { float?: boolean }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <PlayerCard
      flipped={flipped}
      onFlip={() => setFlipped((f) => !f)}
      label={flipped ? FLIP.toFront : FLIP.toBack}
      float={float}
      front={FRONT}
      back={BACK}
    />
  );
}

/** Floats and shows its sheen; tilts toward a mouse (max 6 degrees, lifted 8px); click, Enter or Space flips it. */
export const Interactive_: StoryObj = {
  name: "Interactive",
  render: () => <Interactive />,
};

/**
 * With `prefers-reduced-motion: reduce` (emulate it in DevTools > Rendering) the card stands flat: no float,
 * no sheen, no tilt, and the faces swap with no rotation. Same story, different visitor.
 */
export const ReducedMotion: StoryObj = {
  render: () => <Interactive />,
};

/** The take-away rows: the volt call to action (74px) and two glass rows (64px). */
export const ActionRows: StoryObj = {
  render: () => (
    <div className="flex w-136 flex-col gap-3">
      <ActionRow
        href="#view"
        tone="primary"
        title="VIEW PLAYER CARD"
        sub="FULL RESUME · OPENS AS PDF"
        icon="arrow-right"
      />
      <ActionRow
        href="#download"
        tone="glass"
        title="DOWNLOAD PDF"
        sub="YASH-SARDA-RESUME.PDF"
        icon="download"
      />
      <ActionRow
        as="button"
        type="button"
        tone="glass"
        title="COPY SCOUTING LINK"
        sub="OPENS STRAIGHT TO QUICK VIEW"
        icon="copy"
      />
    </div>
  ),
};

/** After the copy: the status replaces the sub-line (and is announced politely). */
export const ActionRowCopied: StoryObj = {
  render: () => (
    <div className="flex w-136 flex-col gap-3">
      <ActionRow
        as="button"
        type="button"
        tone="glass"
        title="COPY SCOUTING LINK"
        sub="OPENS STRAIGHT TO QUICK VIEW"
        icon="copy"
        status="LINK COPIED ✓"
      />
    </div>
  ),
};

/** Team Up's direct lines at the artboard's 544px column. */
export const ChannelCards: StoryObj = {
  render: () => (
    <div className="flex w-136 flex-col gap-2.5">
      <ChannelCard
        href="#email"
        icon="mail"
        title="EMAIL"
        sub="yashsarda2002@gmail.com"
        glyph="↗"
      />
      <ChannelCard
        href="#linkedin"
        icon="linkedin"
        title="LINKEDIN"
        sub="linkedin.com/in/yash-sarda2107"
        glyph="↗"
      />
      <ChannelCard
        href="#github"
        icon="code"
        title="GITHUB"
        sub="github.com/yashsarda21"
        glyph="↗"
      />
      <ChannelCard
        href="#coding"
        icon="terminal"
        title="CODING PROFILES"
        sub="LeetCode · Codeforces · CodeChef — 750+ solved"
        glyph="↗"
      />
    </div>
  ),
};
