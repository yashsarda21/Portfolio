import { useId, type ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";
import { Glass } from "../primitives/Glass";
import { Heading, Text } from "../primitives/Text";
import { SkillRow } from "./SkillRow";

type SkillGroupProps = {
  /** The group's name ("BACKEND"): the section's heading. */
  name: string;
  /** The shot it is named for ("SHOT · SMASH"), set small on the right of the heading. */
  shotLine: string;
  /** One line under the heading. */
  note: string;
  skills: readonly { name: string; level: "shipped" | "built" | "kit"; tierLabel: string }[];
  /** Fill the bars in one after another (350ms, 40ms apart). */
  animate?: boolean;
  /** The heading's level in the page's outline. Default 2. */
  headingLevel?: 2 | 3 | 4;
  /**
   * For a parent grid of two columns (768 to 1199px): the group spans three of its rows (heading, note, list)
   * so a note that wraps to two lines moves the bars of the group beside it too, and they stay level.
   * Below and above that range it is the plain stack. The parent supplies the rows (implicit, auto).
   */
  alignRows?: boolean;
} & Omit<ComponentPropsWithRef<"section">, "children" | "title" | "aria-labelledby">;

/**
 * A skill group (Badminton-Attributes): a glass section with a name, a shot line, a note and a list of
 * skill rows. It takes every word as a prop, so it knows no content. The note is pulled up under the
 * heading (-8px, as drawn), so the heading and its note read as one block.
 */
export function SkillGroup({
  name,
  shotLine,
  note,
  skills,
  animate,
  headingLevel = 2,
  alignRows = false,
  className,
  ...rest
}: SkillGroupProps) {
  const headingId = useId();
  return (
    <Glass
      as="section"
      aria-labelledby={headingId}
      pad="lg"
      className={cn(
        "flex min-w-0 flex-col gap-3.5 max-md:px-4 max-md:py-4",
        alignRows &&
          "md:max-[1199px]:row-span-3 md:max-[1199px]:grid md:max-[1199px]:grid-rows-subgrid",
        className,
      )}
      {...rest}
    >
      <div className="flex items-baseline justify-between gap-x-4">
        <Heading level={headingLevel} id={headingId} variant="title-group">
          {name}
        </Heading>
        <Text variant="mono-round" tone="label" className="text-right">
          {shotLine}
        </Text>
      </div>
      <Text variant="caption" tone="label" leading="font" className="-mt-2">
        {note}
      </Text>
      {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- the reset removes the bullets, and Safari then drops the list role */}
      <ul role="list" className="flex flex-col gap-3">
        {skills.map((skill) => (
          <li key={skill.name}>
            <SkillRow {...skill} animate={animate} />
          </li>
        ))}
      </ul>
    </Glass>
  );
}
