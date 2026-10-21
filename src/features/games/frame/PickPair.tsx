import { Button } from "@/design-system";

/**
 * The phone's two pick buttons side by side, big enough for a thumb (← and →): each shows its `arrow`, is read out as
 * its `name`, and is lit (primary) while it is the `open` one. A press calls `onPick` with its `key`; while not `live`
 * the buttons are marked disabled and the game decides what a press does.
 */
export function PickPair<K extends string = string>({
  aims,
  live,
  onPick,
}: {
  aims: { key: K; arrow: string; name: string; open: boolean }[];
  live: boolean;
  onPick: (key: K) => void;
}) {
  return (
    <div className="flex w-full gap-3">
      {aims.map((aim) => (
        <Button
          key={aim.key}
          size="tap"
          skew={false}
          glow={false}
          variant={aim.open ? "primary" : "secondary"}
          aria-label={aim.name}
          aria-disabled={!live}
          data-game-control=""
          onClick={() => onPick(aim.key)}
          className="min-w-0 flex-1"
        >
          {aim.arrow}
        </Button>
      ))}
    </div>
  );
}
