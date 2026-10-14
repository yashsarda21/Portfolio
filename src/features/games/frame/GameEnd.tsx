import { useEffect, useRef } from "react";
import { Button } from "@/design-system";
import { ArenaLink } from "@/shell/ArenaLink";
import { cn } from "@/lib/cn";
import type { GameEndView } from "./chrome";

type LinkSpec = NonNullable<GameEndView["primary"]>;

/**
 * What the game offers when it is over. A loss: the venue's page (volt) and play again (glass); after the second
 * loss the volt button is the highlight (G9). A win: only CLAIM, volt. The column adds a quiet BACK TO THE HUB. The stage draws them as skewed 62px
 * buttons side by side; the column stacks them full width, the first 64px. Focus lands on the first button when
 * they appear, if the focus was on the game's controls or nowhere, so a keyboard player is already there (Space and
 * Enter then press that button, never a shot).
 */
export function GameEnd({
  end: { primary, claim, again, hub },
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
  const links = [primary, claim ?? null].filter((l): l is LinkSpec => l !== null);
  return (
    <div
      ref={root}
      className={cn("flex", stage ? "gap-3.5" : "w-full flex-col gap-3 short:flex-row short:gap-2")}
    >
      {links.map((link, i) => (
        <Button
          key={link.to}
          as={ArenaLink}
          to={link.to}
          size={stage ? "ml" : i === 0 ? "bar-lg" : "bar"}
          skew={stage}
          // The column's label may wrap (WATCH THE HIGHLIGHT INSTEAD on a 360px phone): the button grows, never clips, and the lines stay centred and even.
          className={
            stage
              ? "px-8.5"
              : i === 0
                ? "h-auto min-h-16 py-2 text-center text-balance short:flex-1"
                : "short:flex-1"
          }
        >
          {link.label}
        </Button>
      ))}
      {again ? (
        <Button
          variant="secondary"
          size={stage ? "ml" : links.length === 0 ? "bar-lg" : "bar"}
          skew={stage}
          className={stage ? "px-7.5" : "short:flex-1"}
          onClick={onAgain}
        >
          {again}
        </Button>
      ) : null}
      {stage ? null : (
        // The phone has no breadcrumb: a quiet way back to the Hub (the stage's breadcrumb does it).
        <Button
          as={ArenaLink}
          to={hub.to}
          variant="ghost"
          size="bar"
          skew={false}
          className="short:flex-1"
        >
          {hub.label}
        </Button>
      )}
    </div>
  );
}
