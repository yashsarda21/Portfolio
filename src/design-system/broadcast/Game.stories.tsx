import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties, ReactNode } from "react";
import { AimZone } from "./AimZone";
import { AttributeToast } from "./AttributeToast";
import { BallTracker } from "./BallTracker";
import { CourtsideCard } from "./CourtsideCard";
import { LEDMarquee } from "./LEDMarquee";
import { PowerMeter } from "./PowerMeter";
import { RevealChip, RevealList } from "./RevealList";
import { ScoreBug } from "./ScoreBug";
import { TimingMeter } from "./TimingMeter";

const meta: Meta = { title: "Broadcast/Game" };
export default meta;
type Story = StoryObj;

/** The game's clock writes --meter and --power on its root; a story writes them by hand. */
const vars = (v: Record<string, number>) => v as unknown as CSSProperties;

function Row({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="type-mono-note text-dim">{caption}</span>
      {children}
    </div>
  );
}

const CRICKET_ZONES = { good: [38, 62], perfect: [46.5, 53.5] } as {
  good: [number, number];
  perfect: [number, number];
};
const COLUMN_ZONES = { good: [36, 64], perfect: [45, 55] } as {
  good: [number, number];
  perfect: [number, number];
};
const LABELS = { start: "SHORT", target: "YORKER", end: "FULL TOSS" };

/** Cricket-Play's length meter (640 wide, 18 high track, 4x34 cursor) at --meter 0, 0.5 and 1. */
export const TimingMeterStage: Story = {
  render: () => (
    <div className="flex w-160 flex-col gap-10 py-4">
      {[0, 0.5, 1].map((meter) => (
        <Row key={meter} caption={`--meter: ${meter}`}>
          <div style={vars({ "--meter": meter })}>
            <TimingMeter labels={LABELS} zones={CRICKET_ZONES} size="stage" />
          </div>
        </Row>
      ))}
    </div>
  ),
};

/** Mobile-Game's meter (16 high panel track, 4x30 cursor, wider zones "on touch"). */
export const TimingMeterColumn: Story = {
  render: () => (
    <div className="flex w-87.5 flex-col gap-10 py-4">
      {[0, 0.5, 1].map((meter) => (
        <Row key={meter} caption={`--meter: ${meter}`}>
          <div style={vars({ "--meter": meter })}>
            <TimingMeter zones={COLUMN_ZONES} size="column" />
          </div>
        </Row>
      ))}
    </div>
  ),
};

const LEGEND = [
  { name: "SMASH", note: ["Top 20%. Fast,", "but he reads it."], tone: "volt" },
  { name: "CLEAR", note: ["Push him", "to the back line."], tone: "floodlight" },
  { name: "DROP", note: ["Soft. Risky.", "Very satisfying."], tone: "scout" },
] as const;
const POWER_ZONES = { smashFrom: 80, dividerAt: 40 };

/** Badminton-Play's SHOT POWER meter (46x360 with its legend) at --power 0.08 and 0.86. */
export const PowerMeterStage: Story = {
  render: () => (
    <div className="flex gap-16">
      {[0.08, 0.86].map((power) => (
        <Row key={power} caption={`--power: ${power}`}>
          <div style={vars({ "--power": power })}>
            <PowerMeter zones={POWER_ZONES} legend={LEGEND} size="stage" />
          </div>
        </Row>
      ))}
    </div>
  ),
};

/** The phone's slim meter: the track alone, 28 wide, as tall as its parent (240 here). */
export const PowerMeterColumn: Story = {
  render: () => (
    <div className="flex gap-16">
      {[0.08, 0.86].map((power) => (
        <Row key={power} caption={`--power: ${power}`}>
          <div className="h-60" style={vars({ "--power": power })}>
            <PowerMeter zones={POWER_ZONES} legend={LEGEND} size="column" />
          </div>
        </Row>
      ))}
    </div>
  ),
};

/** Cricket-Play's over: a dot (yours), a four (his), the ball to bowl, and the ball after it. */
export const BallTrackerStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Row caption="for you · against you · current · pending">
        <BallTracker
          balls={[
            { label: "•", state: "for" },
            { label: "4", state: "against" },
            { label: "3", state: "current" },
          ]}
        />
      </Row>
      <Row caption="a fresh over">
        <BallTracker
          balls={[
            { label: "1", state: "current" },
            { label: "2", state: "pending" },
            { label: "3", state: "pending" },
          ]}
        />
      </Row>
    </div>
  ),
};

/** Tennis-Play's aim zones: idle (dashed), the open court (volt) and disabled (no serve in play). */
export const AimZones: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Row caption="idle + open">
        <div className="flex gap-1.5">
          <AimZone label="← LEFT" name="Return to the left" open={false} onPick={() => {}} />
          <AimZone
            label="OPEN COURT →"
            name="Return to the right, open court"
            open
            onPick={() => {}}
          />
        </div>
      </Row>
      <Row caption="disabled">
        <div className="flex gap-1.5">
          <AimZone
            label="← LEFT"
            name="Return to the left"
            open={false}
            disabled
            onPick={() => {}}
          />
          <AimZone
            label="RIGHT →"
            name="Return to the right"
            open={false}
            disabled
            onPick={() => {}}
          />
        </div>
      </Row>
    </div>
  ),
};

/** Cricket-Play's STADIUM SCREEN (360 wide, as drawn) before the first ball, after one ball and after three. */
export const RevealPanel: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-10">
      <RevealList
        className="w-90"
        title="STADIUM SCREEN"
        count="0 / 3 UNLOCKED"
        slots={[
          { state: "locked", label: "INNINGS 01 · LOCKED", hint: "BOWL BALL 1" },
          { state: "locked", label: "INNINGS 02 · LOCKED", hint: "BOWL BALL 2" },
          { state: "locked", label: "INNINGS 03 · LOCKED", hint: "BOWL BALL 3" },
        ]}
      />
      <RevealList
        className="w-90"
        title="STADIUM SCREEN"
        count="1 / 3 UNLOCKED"
        slots={[
          {
            state: "open",
            eyebrow: "INNINGS 01 · NOT OUT",
            title: "DEUTSCHE BANK",
            meta: "Software Engineer 1 · Jul 2024 – now",
          },
          { state: "locked", label: "INNINGS 02 · LOCKED", hint: "BOWL BALL 2" },
          { state: "locked", label: "INNINGS 03 · LOCKED", hint: "BOWL BALL 3" },
        ]}
      />
      <RevealList
        className="w-90"
        title="STADIUM SCREEN"
        count="3 / 3 UNLOCKED"
        slots={[
          {
            state: "open",
            eyebrow: "INNINGS 01 · NOT OUT",
            title: "DEUTSCHE BANK",
            meta: "Software Engineer 1 · Jul 2024 – now",
          },
          {
            state: "open",
            eyebrow: "INNINGS 02 · DEBUT",
            title: "DEUTSCHE BANK",
            meta: "Graduate Analyst Intern · Jun – Jul 2023",
          },
          {
            state: "open",
            eyebrow: "INNINGS 03 · ACADEMY",
            title: "PICT, PUNE",
            meta: "B.Tech, Information Technology · 2020 – 2024",
          },
        ]}
      />
    </div>
  ),
};

/** Mobile-Game's reveal chip (a phone is 390 wide, 12px gutters). */
export const RevealChipStory: Story = {
  name: "Reveal Chip",
  render: () => (
    <div className="w-87.5">
      <RevealChip
        eyebrow="INNINGS 01 UNLOCKED · NOT OUT"
        title="DEUTSCHE BANK"
        meta="Software Engineer 1 · Jul 2024 – now"
      />
    </div>
  ),
};

/** Tennis-Play's two courtside cards: the left hinged on its left edge, the right on its right. */
export const CourtsideCards: Story = {
  render: () => (
    <div className="flex justify-between gap-10 py-8">
      <CourtsideCard
        side="left"
        eyebrow="HIGHLIGHT 01 · QF"
        tag="RALLY 1"
        title="POWER BI DASHBOARD"
        line="Interactive Power BI reports, embedded and secured with server-side tokens."
        media="[SCREEN RECORDING]"
      />
      <CourtsideCard
        side="right"
        eyebrow="HIGHLIGHT 02 · SF"
        tag="RALLY 2"
        title="KUDO BOARD"
        line="Recognition platform for 10,000+ employees at Deutsche Bank."
        media="[SCREEN RECORDING]"
      />
    </div>
  ),
};

/** Badminton-Play's toast column (340 wide): two charged (the newest edged in volt), then UP NEXT and a later one. */
export const AttributeToasts: Story = {
  render: () => (
    <div className="flex w-85 flex-col gap-2.5 overflow-hidden">
      <AttributeToast
        state="charged"
        eyebrow="ATTRIBUTE CHARGED · RALLY 1"
        tag="SMASH"
        title="BACKEND"
        chips={["Java", "Spring Boot", "JUnit"]}
      />
      <AttributeToast
        state="charged"
        accent
        eyebrow="ATTRIBUTE CHARGED · RALLY 2"
        tag="DEFENCE"
        title="DATA"
        chips={["Oracle", "SQL"]}
      />
      <AttributeToast state="next" label="FRONTEND" hint="UP NEXT · RALLY 3" />
      <AttributeToast state="later" label="CRAFT" hint="RALLY 4" />
    </div>
  ),
};

/** Tennis-Play's far LED board with its four lines (it slides; reduced motion stands still at frame 0). */
export const Marquee: Story = {
  render: () => (
    <LEDMarquee
      items={[
        { text: "MATCH HIGHLIGHTS · 2 / 3 UNLOCKED", tone: "volt" },
        { text: "ANOTHER PROJECT SHIPPED", tone: "floodlight" },
        { text: "MATCH POINT · THE FINAL IS NEXT", tone: "volt" },
        { text: "CENTRE COURT", tone: "floodlight" },
      ]}
    />
  ),
};

/** The three game score bugs as drawn: cricket (16px cells), tennis and badminton (14px cells; match point is the alert chip). */
export const GameScoreBugs: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <ScoreBug label="Yash 0 not out, ball 1 of 3, you bowling">
        <ScoreBug.Name>YASH</ScoreBug.Name>
        <ScoreBug.Cell>0*</ScoreBug.Cell>
        <ScoreBug.Meta>BALL 1 OF 3</ScoreBug.Meta>
        <ScoreBug.Away>YOU BOWLING</ScoreBug.Away>
      </ScoreBug>
      <ScoreBug label="Yash serving, 40–30, rally 3">
        <ScoreBug.Name serving>YASH</ScoreBug.Name>
        <ScoreBug.Cell pad="tight">40</ScoreBug.Cell>
        <ScoreBug.Cell pad="tight" muted>
          30
        </ScoreBug.Cell>
        <ScoreBug.Away tone="line">YOU</ScoreBug.Away>
        <ScoreBug.Status>RALLY 3</ScoreBug.Status>
      </ScoreBug>
      <ScoreBug label="Match point, 20–19">
        <ScoreBug.Name>YASH</ScoreBug.Name>
        <ScoreBug.Cell pad="tight">20</ScoreBug.Cell>
        <ScoreBug.Cell pad="tight" muted>
          19
        </ScoreBug.Cell>
        <ScoreBug.Away tone="line">YOU</ScoreBug.Away>
        <ScoreBug.Status alert>MATCH POINT</ScoreBug.Status>
      </ScoreBug>
    </div>
  ),
};
