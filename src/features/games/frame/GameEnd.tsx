import { useEffect, useRef } from "react";
import { Button } from "@/design-system";
import { ArenaLink } from "@/shell/ArenaLink";
import { cn } from "@/lib/cn";
import type { GameEndView } from "./chrome";

/**
 * What the game offers when it is over: the main button (volt) and play again (glass). The main button is always the
 * venue's page, or after the second loss the highlight (G9). Once the matchday is complete (F3) a quiet SEE FULL TIME
 * link follows: on the stage after play again, in the column in place of the quiet BACK TO THE HUB (which it
 * otherwise adds). The stage draws them as skewed 62px buttons side by side; the column stacks
 * them full width, the first 64px. Focus lands on the first button when
 * they appear, if the focus was on the game's controls or nowhere, so a keyboard player is already there (Space and
 * Enter then press that button, never a shot).
 */
export function GameEnd({
  end: { primary, again, next, hub },
  onAgain,
  size,
}: {
  end: GameEndView;
  onAgain: () => void;
  size: "stage" | "column";
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // The end takes the focus only from the game's own controls (they are gone, or still there but over), or from
    // nowhere (the page body): never from a visitor who has tabbed to QUICK VIEW, the sound or the breadcrumb.
    const now = document.activeElement;
    const free = !now || now === document.body || now.closest("[data-game-control]") !== null;
    if (free) root.current?.querySelector<HTMLElement>("a, button")?.focus();
  }, []);

  const stage = size === "stage";
  // The quiet third link: SEE FULL TIME once the matchday is complete; else (the phone only) the way back to the Hub.
  const quiet = next ?? (stage ? null : hub);
  return (
    <div
      ref={root}
      className={cn("flex", stage ? "gap-3.5" : "w-full flex-col gap-3 short:flex-row short:gap-2")}
    >
      <Button
        as={ArenaLink}
        to={primary.to}
        size={stage ? "ml" : "bar-lg"}
        skew={stage}
        // The column's label may wrap (WATCH THE HIGHLIGHT INSTEAD on a 360px phone): the button grows, never clips, and the lines stay centred and even.
        className={stage ? "px-8.5" : "h-auto min-h-16 py-2 text-center text-balance short:flex-1"}
      >
        {primary.label}
      </Button>
      <Button
        variant="secondary"
        size={stage ? "ml" : "bar"}
        skew={stage}
        className={stage ? "px-7.5" : "short:flex-1"}
        onClick={onAgain}
      >
        {again}
      </Button>
      {quiet ? (
        // The phone has no breadcrumb, so its quiet link is the way back to the Hub unless Full Time takes the place.
        <Button
          as={ArenaLink}
          to={quiet.to}
          variant="ghost"
          size={stage ? "ml" : "bar"}
          skew={stage}
          className={stage ? "px-7.5" : "short:flex-1"}
        >
          {quiet.label}
        </Button>
      ) : null}
    </div>
  );
}
