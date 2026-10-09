import { cn } from "@/lib/cn";
import { Chip } from "../primitives/Chip";
import { Glass } from "../primitives/Glass";

export type AttributeToastProps = (
  | {
      state: "charged";
      eyebrow: string;
      tag: string;
      title: string;
      chips: readonly string[];
      /** The newest charge: a volt edge. */
      accent?: boolean;
    }
  | { state: "next" | "later"; label: string; hint: string }
) & { className?: string };

/**
 * A skill group the badminton game has charged (Badminton-Play): a glass toast that slides in from the right with
 * its shipped skills as chips (stagger several with `--d`). A group still to come is a quiet dashed row, `next`
 * or `later`. All of it is content, so it is read by assistive tech.
 */
export function AttributeToast(props: AttributeToastProps) {
  if (props.state !== "charged") {
    return (
      <Glass
        surface="dashed"
        data-state={props.state}
        className={cn("flex justify-between px-4.5 py-3.5", props.className)}
      >
        <span className="type-mono-round text-dim">{props.label}</span>
        <span className="type-mono-note text-dim">{props.hint}</span>
      </Glass>
    );
  }
  return (
    <Glass
      edge={props.accent ? "volt" : "none"}
      data-state="charged"
      data-accent={props.accent ? "" : undefined}
      className={cn("flex animate-slide-in flex-col gap-2.5 px-4.5 py-4", props.className)}
    >
      <div className="flex justify-between">
        <span className="type-mono-round text-volt">{props.eyebrow}</span>
        <span className="type-mono-note text-scout">{props.tag}</span>
      </div>
      <span className="type-title-matchday">{props.title}</span>
      <ul className="flex flex-wrap gap-1.5">
        {props.chips.map((chip) => (
          <li key={chip}>
            <Chip text="name" className="h-auto px-2.25 py-1.25">
              {chip}
            </Chip>
          </li>
        ))}
      </ul>
    </Glass>
  );
}
