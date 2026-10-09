import { useEffect, useRef } from "react";
import { Button } from "@/design-system";
import { ArenaLink } from "@/shell/ArenaLink";
import { cn } from "@/lib/cn";

interface LinkSpec {
  label: string;
  to: string;
}

/**
 * What the game offers when it is over. A loss: the venue's page (volt) and play again (glass); after the second
 * loss the volt button is the highlight (G9). A win: only CLAIM, volt. The stage draws them as skewed 62px
 * buttons side by side; the column stacks them full width, the first 64px. Focus lands on the first button when
 * they appear, so a keyboard player is already there (Space and Enter then press that button, never a shot).
 */
export function GameEnd({
  primary,
  claim,
  again,
  size,
}: {
  primary: LinkSpec | null;
  claim?: LinkSpec;
  again?: { label: string; onClick: () => void };
  size: "stage" | "column";
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    root.current?.querySelector<HTMLElement>("a, button")?.focus();
  }, []);

  const stage = size === "stage";
  const links = [primary, claim ?? null].filter((l): l is LinkSpec => l !== null);
  return (
    <div ref={root} className={cn("flex", stage ? "gap-3.5" : "w-full flex-col gap-3")}>
      {links.map((link, i) => (
        <Button
          key={link.to}
          as={ArenaLink}
          to={link.to}
          size={stage ? "ml" : i === 0 ? "bar-lg" : "bar"}
          skew={stage}
          // The column's label may wrap (WATCH THE HIGHLIGHT INSTEAD on a 360px phone): the button grows, never clips.
          className={stage ? "px-8.5" : i === 0 ? "h-auto min-h-16 py-2" : undefined}
        >
          {link.label}
        </Button>
      ))}
      {again ? (
        <Button
          variant="secondary"
          size={stage ? "ml" : links.length === 0 ? "bar-lg" : "bar"}
          skew={stage}
          className={stage ? "px-7.5" : undefined}
          onClick={again.onClick}
        >
          {again.label}
        </Button>
      ) : null}
    </div>
  );
}
