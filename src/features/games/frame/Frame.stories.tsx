import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, within } from "storybook/test";
import { ui } from "@/content";
import { Button, RevealChip, ScoreBug } from "@/design-system";
import { ROUTES } from "@/shell/routes";
import { withShell } from "@/shell/storyDecorators";
import { buildGameChrome, buildGameEnd, type GameEndView } from "./chrome";
import { GameAnnouncer } from "./GameAnnouncer";
import { GameColumn } from "./GameColumn";
import { GameEnd } from "./GameEnd";
import { GameStage } from "./GameStage";

const meta: Meta = {
  title: "Features/Games/Frame",
  parameters: { layout: "fullscreen" },
  decorators: [withShell],
};
export default meta;

const chrome = buildGameChrome(ui, ROUTES, "cricket");
const cricket = ui.games.cricket;

/** Cricket's score bug, as a placeholder: the real one is the game's. */
const bug = (size: "md" | "sm") => (
  <ScoreBug label={ui.games.bug} size={size}>
    <ScoreBug.Name>{ui.hub.record.yash}</ScoreBug.Name>
    <ScoreBug.Cell>6{cricket.notOutMark}</ScoreBug.Cell>
    <ScoreBug.Meta>
      {cricket.ball} 2 {cricket.of} 3
    </ScoreBug.Meta>
  </ScoreBug>
);

/** The empty reveal: what the column shows before the first unlock. */
const reveal = (
  <RevealChip
    eyebrow={`${cricket.innings} 01 ${cricket.locked}`}
    title={cricket.screen}
    meta={ui.games.firstReveal}
  />
);

/** Both layouts from one page, as a game renders them: CSS shows exactly one (the stage from 1200px). */
function FramePage() {
  return (
    <main id="main">
      <GameStage chrome={chrome} venue="turf" bug={bug("md")}>
        <h1 className="sr-only">{chrome.heading}</h1>
        <div data-game="" className="absolute inset-0 grid place-items-center">
          <Button size="l">{cricket.bowl}</Button>
        </div>
      </GameStage>
      <GameColumn
        chrome={chrome}
        venue="turf"
        heading={chrome.heading}
        bug={bug("sm")}
        reveal={reveal}
        thumb={
          <Button size="bar-lg" skew={false}>
            {cricket.bowlPhone}
          </Button>
        }
      />
      <GameAnnouncer line={ui.games.firstReveal} />
    </main>
  );
}

/** Roles skip what CSS hides, so each name resolves to the one control of the layout on screen. */
async function expectTargets(canvas: ReturnType<typeof within>) {
  const skip = canvas.getByRole("link", { name: new RegExp(chrome.skip.label) });
  const quick = canvas.getByRole("link", { name: ui.hud.quickView });
  for (const el of [skip, quick]) {
    await expect(el.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  }
}

/** The page at its width: the 1440×900 board from 1200px, the column below. SKIP and QUICK VIEW are 44px or more. */
export const Page: StoryObj = {
  render: () => <FramePage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectTargets(canvas);
  },
};

function Shape({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="type-mono-note text-dim">{caption}</span>
      {children}
    </div>
  );
}

/** The end of an over, as the cricket view builds it. */
const end = (won: boolean, offerHighlight: boolean): GameEndView =>
  buildGameEnd(ui, ROUTES, chrome, {
    over: true,
    won,
    offerHighlight,
    see: cricket.see,
    claim: cricket.claim,
    again: cricket.again,
  })!;

/** The end buttons: a loss, the highlight offer after the second loss, and a win; on the stage and in the column. */
export const End: StoryObj = {
  parameters: { layout: "padded" },
  render: () => {
    const ends = [
      ["Loss", end(false, false)],
      ["Offer", end(false, true)],
      ["Win", end(true, false)],
    ] as const;
    return (
      <div className="flex flex-col gap-10 p-6">
        <div className="flex flex-col gap-8">
          {ends.map(([caption, e]) => (
            <Shape key={caption} caption={`stage · ${caption}`}>
              <GameEnd end={e} onAgain={() => {}} size="stage" />
            </Shape>
          ))}
        </div>
        <div className="flex flex-wrap gap-8">
          {ends.map(([caption, e]) => (
            <Shape key={caption} caption={`column · ${caption}`}>
              <div className="w-87.5">
                <GameEnd end={e} onAgain={() => {}} size="column" />
              </div>
            </Shape>
          ))}
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("link", { name: cricket.see })).toHaveLength(2);
    await expect(canvas.getAllByRole("link", { name: cricket.claim })).toHaveLength(2);
    await expect(canvas.getAllByRole("button", { name: cricket.again })).toHaveLength(4);
  },
};
