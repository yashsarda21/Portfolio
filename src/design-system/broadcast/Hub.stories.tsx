import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { useState } from "react";
import { Drawer } from "../primitives/Drawer";
import { Glass } from "../primitives/Glass";
import { ProgressSteps } from "../primitives/ProgressSteps";
import { Text } from "../primitives/Text";
import { ArenaBackdrop } from "../scene/ArenaBackdrop";
import { FacilityTile } from "./FacilityTile";
import { IndexRail, RailSection } from "./IndexRail";
import { RecordChip } from "./RecordChip";
import { VenueCard } from "./VenueCard";
import { VenueFixture } from "./VenueFixture";

const meta: Meta = { title: "Broadcast/Hub", parameters: { layout: "fullscreen" } };
export default meta;
type Story = StoryObj;

const CARDS = {
  cricket: {
    scene: "turf",
    number: "VENUE 01",
    name: "CRICKET GROUND",
    blurb: "Bowl me a 3-ball over. Every ball you bowl unlocks an innings of my career.",
    reveals: "REVEALS · CAREER STATS · ~10s",
    play: { label: "PLAY", href: "#cricket-play" },
    rematch: { label: "REMATCH", href: "#cricket-play" },
    skip: { label: "SKIP", href: "#career" },
    score: "14* NOT OUT",
  },
  tennis: {
    scene: "court",
    number: "VENUE 02",
    name: "CENTRE COURT",
    blurb: "Return my serve. Every shot you get back puts a project on the big screen.",
    reveals: "REVEALS · MATCH HIGHLIGHTS · ~12s",
    play: { label: "PLAY", href: "#tennis-play" },
    rematch: { label: "REMATCH", href: "#tennis-play" },
    skip: { label: "SKIP", href: "#highlights" },
    score: "WON 2-1",
  },
  badminton: {
    scene: "hall",
    number: "VENUE 03",
    name: "BADMINTON HALL",
    blurb: "Hold, release, smash. Every rally won charges one of my player attributes.",
    reveals: "REVEALS · PLAYER ATTRIBUTES · ~10s",
    play: { label: "PLAY", href: "#badminton-play" },
    rematch: { label: "REMATCH", href: "#badminton-play" },
    skip: { label: "SKIP", href: "#attributes" },
    score: "WON 15-9",
  },
} as const;
type CardKey = keyof typeof CARDS;

function Card({
  venue,
  played,
  slotClassName,
}: {
  venue: CardKey;
  played: boolean;
  slotClassName?: string;
}) {
  const c = CARDS[venue];
  return (
    <VenueCard
      data-testid={`venue-card-${venue}`}
      scene={c.scene}
      number={c.number}
      played={played}
      status={played ? `PLAYED · ${c.score}` : "UNPLAYED"}
      name={c.name}
      blurb={c.blurb}
      reveals={c.reveals}
      play={played ? c.rematch : c.play}
      skip={c.skip}
      slotClassName={slotClassName}
    />
  );
}

/** The Hub's arc at artboard coordinates over the Hub backdrop: cricket played, tennis and badminton not. The tennis card is compared with Hub@1440x900. */
export const VenueCardArc: Story = {
  render: () => (
    <div className="relative h-225 w-360">
      <ArenaBackdrop layout="hub" />
      <div className="absolute top-51.5 right-9 left-76 grid h-110 grid-cols-3 gap-7 perspective-arc">
        <Card venue="cricket" played slotClassName="[--arc-ry:10deg]" />
        <Card venue="tennis" played={false} slotClassName="[--arc-y:-14px]" />
        <Card venue="badminton" played={false} slotClassName="[--arc-ry:-10deg]" />
      </div>
    </div>
  ),
};

/** The other state of each card, flat: cricket unplayed, tennis and badminton played. */
export const VenueCardStates: Story = {
  render: () => (
    <div className="flex w-360 gap-7 bg-ground p-7">
      <div className="h-110 w-87">
        <Card venue="cricket" played={false} />
      </div>
      <div className="h-110 w-87">
        <Card venue="tennis" played />
      </div>
      <div className="h-110 w-87">
        <Card venue="badminton" played />
      </div>
    </div>
  ),
};

const FIXTURES = [
  {
    scene: "turf",
    meta: "VENUE 01 · CAREER",
    name: "CRICKET GROUND",
    played: true,
    status: "14* NOT OUT",
    play: "REMATCH",
    skip: "SEE STATS",
  },
  {
    scene: "court",
    meta: "VENUE 02 · PROJECTS",
    name: "CENTRE COURT",
    played: false,
    status: "~12s",
    play: "PLAY",
    skip: "SKIP",
  },
  {
    scene: "hall",
    meta: "VENUE 03 · SKILLS",
    name: "BADMINTON HALL",
    played: false,
    status: "~10s",
    play: "PLAY",
    skip: "SKIP",
  },
] as const;

/** The phone's fixtures at Mobile-Hub coordinates: cricket played, the others not. */
export const VenueFixtures: Story = {
  render: () => (
    <div className="relative h-211 w-97.5 bg-ground">
      <div className="absolute inset-x-4 top-46.5 flex flex-col gap-3">
        {FIXTURES.map((f) => (
          <VenueFixture
            key={f.scene}
            data-testid={`venue-fixture-${f.scene}`}
            scene={f.scene}
            meta={f.meta}
            status={f.status}
            played={f.played}
            name={f.name}
            play={{ label: f.play, href: "#play" }}
            skip={{ label: f.skip, href: "#skip" }}
          />
        ))}
      </div>
    </div>
  ),
};

export const FacilityTiles: Story = {
  render: () => (
    <div className="relative h-225 w-360">
      <ArenaBackdrop layout="hub" />
      <div className="absolute top-42 right-9 left-76 grid grid-cols-4 gap-4">
        <FacilityTile
          label="ACHIEVEMENTS"
          title="TROPHY ROOM"
          tone="glass"
          size="lg"
          href="#trophies"
        />
        <FacilityTile
          label="EDUCATION"
          title="TRAINING ACADEMY"
          tone="glass"
          size="lg"
          href="#academy"
        />
        <FacilityTile label="RESUME" title="VIEW PLAYER CARD" tone="glass" size="lg" href="#card" />
        <FacilityTile label="CONTACT" title="TEAM UP" tone="volt" size="lg" href="#team-up" />
      </div>
      <div className="absolute top-80 left-76 grid w-87.5 grid-cols-2 gap-2">
        <FacilityTile label="AWARDS" title="TROPHY ROOM" tone="line" size="sm" href="#trophies" />
        <FacilityTile label="EDUCATION" title="ACADEMY" tone="line" size="sm" href="#academy" />
      </div>
    </div>
  ),
};

const INDEX = [
  { key: "career", label: "Career Stats", tag: "SEEN", seen: true, href: "#career" },
  {
    key: "highlights",
    label: "Match Highlights",
    tag: "PROJECTS",
    seen: false,
    href: "#highlights",
  },
  {
    key: "attributes",
    label: "Player Attributes",
    tag: "SKILLS",
    seen: false,
    href: "#attributes",
  },
  { key: "trophies", label: "Trophy Room", tag: "AWARDS", seen: false, href: "#trophies" },
  { key: "academy", label: "Training Academy", tag: "EDUCATION", seen: false, href: "#academy" },
  { key: "card", label: "Player Card", tag: "RESUME", seen: false, href: "#card" },
  { key: "team-up", label: "Team Up", tag: "CONTACT", seen: false, href: "#team-up" },
];

const rail = (
  <IndexRail
    label="Portfolio index"
    title="JUMP STRAIGHT TO"
    links={INDEX}
    className="h-full"
    header={
      <RailSection label="MATCHDAY CARD">
        <Text variant="title-matchday" tone="primary">
          1 OF 3 VENUES
        </Text>
        <ProgressSteps total={3} done={1} label="1 of 3 venues played" className="mt-1" />
      </RailSection>
    }
    footer={
      // Parity only: these are the artboard's own words (Hub@1440x900 draws HIDDEN ACHIEVEMENTS); the app says FULL TIME.
      <RailSection label="HIDDEN ACHIEVEMENTS">
        <Text as="p" variant="body-sm" tone="secondary" leading="font">
          0 of 1 unlocked. Rumour says you have to beat him.
        </Text>
      </RailSection>
    }
  />
);

/** The left rail at artboard coordinates (x 36, y 104, 236 x 760), compared with Hub@1440x900. */
export const IndexRailFidelity: Story = {
  render: () => (
    <div className="relative h-225 w-360">
      <ArenaBackdrop layout="hub" />
      <Glass
        as="aside"
        data-testid="index-rail"
        className="absolute top-26 bottom-9 left-9 w-59 px-4.5 py-5"
      >
        {rail}
      </Glass>
    </div>
  ),
};

export const RecordChips: Story = {
  render: () => (
    <div className="flex bg-ground p-7">
      <RecordChip label="RECORD" value="YASH 1 · YOU 0" />
    </div>
  ),
};

function DrawerDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="h-screen bg-ground p-7">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 glass px-4 type-mono-xs text-floodlight"
      >
        INDEX
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        label="Portfolio index"
        closeLabel="Close index"
      >
        {rail}
      </Drawer>
    </div>
  );
}

/** Open the drawer: focus moves into it, and Esc brings it back to INDEX. */
export const DrawerOpen: Story = {
  render: () => <DrawerDemo />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("button", { name: "INDEX" }));
    const dialog = await body.findByRole("dialog", { name: "Portfolio index" });
    await expect(within(dialog).getByRole("button", { name: "Close index" })).toHaveFocus();
  },
};
