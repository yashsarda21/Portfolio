import { cn } from "@/lib/cn";

type Side = { name: string; score: string };

interface ResultBoardProps {
  /** What a screen reader hears for the whole board, e.g. "Final score: You 0, Yash 3". */
  label: string;
  home: Side;
  away: Side;
  /** The side that won: its name is the volt cell and its score is lit; the other side is dimmed. */
  winner: "home" | "away";
  /** The board twitches every 3.2s (the Easter-Egg's flipped scoreboard). Reduced motion: it stands still. */
  glitch?: boolean;
  className?: string;
}

// 22px of padding as drawn; 16px on a phone, so the board holds a 360px screen.
const CELL = "flex items-center px-4 md:px-5.5";

/**
 * A one-row scoreboard, home name, home score, away score, away name (Easter-Egg's flipped scoreboard). The winner's
 * name is a volt cell with ink text and its score is lit; the loser's name and score are dim (the artboard draws the
 * loser's score a step darker, #5D6670, a decoration grey that fails text contrast, spec A1). Nothing is struck
 * through. The board is one picture with one sentence for assistive tech (`label`); its cells are decoration.
 */
export function ResultBoard({ label, home, away, winner, glitch, className }: ResultBoardProps) {
  const name = (side: "home" | "away", who: Side) => (
    <span
      aria-hidden="true"
      className={cn(
        CELL,
        "type-title-board",
        winner === side ? "bg-volt text-volt-ink" : "text-dim",
      )}
    >
      {who.name}
    </span>
  );
  const score = (side: "home" | "away", who: Side) => (
    <span
      aria-hidden="true"
      className={cn(
        CELL,
        "type-stat",
        winner === side ? "text-floodlight" : "text-dim",
        side === "away" && "border-l border-line-strong",
      )}
    >
      {who.score}
    </span>
  );
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "flex h-16 items-stretch border border-line-strong bg-board",
        glitch && "animate-glitch",
        className,
      )}
    >
      {name("home", home)}
      {score("home", home)}
      {score("away", away)}
      {name("away", away)}
    </div>
  );
}
