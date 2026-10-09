/**
 * What a screen reader hears of the game: each call plus what it revealed (the reveals are content). A polite
 * live region, on phones too, and separate from the COMM line (which is silent on a phone, L11). Change `line` to say it.
 */
export function GameAnnouncer({ line }: { line: string }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {line}
    </div>
  );
}
