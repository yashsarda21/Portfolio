import { IconButton } from "../primitives/IconButton";
import { HUDButton } from "./HUDButton";

interface AudioToggleProps {
  /** Accessible name, e.g. "Crowd audio". State is conveyed by aria-pressed. */
  name: string;
  on: boolean;
  onToggle: () => void;
  variant?: "labelled" | "icon";
  labelOn?: string;
  labelOff?: string;
  className?: string;
}

export function AudioToggle({
  name,
  on,
  onToggle,
  variant = "labelled",
  labelOn,
  labelOff,
  className,
}: AudioToggleProps) {
  if (variant === "icon") {
    return (
      <IconButton
        icon={on ? "speaker-loud" : "speaker-off"}
        label={name}
        pressed={on}
        onClick={onToggle}
        className={className}
      />
    );
  }
  return (
    <HUDButton
      icon={on ? "speaker-loud" : "speaker-off"}
      aria-label={name}
      aria-pressed={on}
      onClick={onToggle}
      className={className}
    >
      {on ? labelOn : labelOff}
    </HUDButton>
  );
}
