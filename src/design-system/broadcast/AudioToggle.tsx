import { cn } from "@/lib/cn";
import { IconButton } from "../primitives/IconButton";
import { HUDButton } from "./HUDButton";

interface AudioToggleProps {
  /** Icon variant: the accessible name, e.g. "Crowd audio". State is conveyed by aria-pressed. */
  name: string;
  on: boolean;
  onToggle: () => void;
  /** "text" is the phone's chip: the word and its state, no speaker glyph. */
  variant?: "labelled" | "icon" | "text";
  /** Labelled variant: the stable visible word that names the button, e.g. "CROWD". Defaults to `name`. */
  label?: string;
  /** Labelled variant: visual-only state words, e.g. "ON" / "OFF" (aria-pressed already says it). */
  stateOn?: string;
  stateOff?: string;
  className?: string;
}

export function AudioToggle({
  name,
  on,
  onToggle,
  variant = "labelled",
  label,
  stateOn,
  stateOff,
  className,
}: AudioToggleProps) {
  if (variant === "icon") {
    // The artboards keep the speaker floodlight-white when on; the loud/off glyph and aria-pressed carry state.
    return (
      <IconButton
        icon={on ? "speaker-loud" : "speaker-off"}
        label={name}
        pressed={on}
        onClick={onToggle}
        className={cn("aria-pressed:text-floodlight", className)}
      />
    );
  }
  const text = variant === "text";
  // No aria-label: the visible word is the accessible name (WCAG 2.5.3), aria-pressed carries the state.
  return (
    <HUDButton
      icon={text ? undefined : on ? "speaker-loud" : "speaker-off"}
      tone={text ? "glass-compact" : undefined}
      aria-pressed={on}
      onClick={onToggle}
      className={className}
    >
      <span>{label ?? name}</span> <span aria-hidden="true">{on ? stateOn : stateOff}</span>
    </HUDButton>
  );
}
