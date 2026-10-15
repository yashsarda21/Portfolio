import { useEffect, useId, useRef } from "react";
import { BrandLockup, Button, Text } from "@/design-system";
import type { LandingView } from "./view";

/** Everything the page behind the start screen holds that a keyboard or a screen reader could reach. */
const BEHIND = ["#main", "a[href='#main']"] as const;

interface StartScreenProps {
  view: Pick<LandingView, "start" | "brand">;
  /** True while the screen is up (the Landing decides, after hydration, from the page's flags). It holds focus and shuts the page behind. */
  open: boolean;
  /** The visitor's choice: with sound, or in silence. Either one starts the show. */
  onChoose: (sound: boolean) => void;
}

/**
 * The first-visit start screen. Browsers allow no sound before a click, so a visitor's first Landing waits behind
 * this one: a dark overlay with the arena's ground and one volt spotlight, a KICK OFF · SOUND ON button (focused)
 * and a quiet KICK OFF IN SILENCE. It is always in the page, but CSS (start.css) shows it only for a first visit with
 * scripts running, so the prerendered page never flashes it and a visitor without JavaScript never sees it. The
 * Landing's boot is held under it by the same CSS and starts on either choice.
 *
 * It is a modal dialog by hand (a `<dialog>` would need script to open and so would flash late): while `open`, the
 * page behind is `inert`, which takes it out of the tab order and the accessibility tree, and focus goes to SOUND ON.
 */
export function StartScreen({ view, open, onChoose }: StartScreenProps) {
  const noteId = useId();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const behind = BEHIND.flatMap((selector) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)),
    );
    for (const el of behind) el.inert = true;
    root.current?.querySelector<HTMLElement>("[data-start-primary]")?.focus();
    return () => {
      for (const el of behind) el.inert = false;
    };
  }, [open]);

  return (
    <div
      ref={root}
      data-start-screen=""
      role="dialog"
      aria-modal="true"
      aria-label={view.start.label}
      aria-describedby={noteId}
      className="fixed inset-0 z-50 flex-col items-center justify-center gap-10 overflow-y-auto bg-ground px-(--gutter) py-10 text-center"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 scene-glow-volt scene-venue-glow"
      />
      <BrandLockup mark={view.brand.mark} label={view.brand.label} className="relative" />
      <div className="relative flex w-full max-w-100 flex-col items-stretch gap-3">
        <Button data-start-primary="" size="bar-lg" onClick={() => onChoose(true)}>
          {view.start.soundOn}
        </Button>
        <Button variant="ghost" size="bar" onClick={() => onChoose(false)}>
          {view.start.silent}
        </Button>
        <Text as="p" id={noteId} variant="mono-tag" tone="secondary" className="mt-3 text-balance">
          {view.start.note}
        </Text>
      </div>
    </div>
  );
}
